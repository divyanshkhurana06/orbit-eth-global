// Solana Smart Contract for SkillDuels Escrow
// This is a Phase 2 implementation - not used in MVP
// Built with Anchor framework

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("YourProgramIDHere111111111111111111111111111");

#[program]
pub mod skill_duels_escrow {
    use super::*;

    /// Initialize a new game escrow
    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        game_id: String,
        wager_amount: u64,
    ) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        game_escrow.game_id = game_id;
        game_escrow.player1 = ctx.accounts.player1.key();
        game_escrow.player2 = Pubkey::default();
        game_escrow.wager_amount = wager_amount;
        game_escrow.status = GameStatus::WaitingForPlayer;
        game_escrow.winner = Pubkey::default();
        game_escrow.created_at = Clock::get()?.unix_timestamp;
        
        // Transfer SOL from player1 to escrow
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.player1.key(),
                &game_escrow.key(),
                wager_amount,
            ),
            &[
                ctx.accounts.player1.to_account_info(),
                game_escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!("Game escrow initialized for game: {}", game_escrow.game_id);
        Ok(())
    }

    /// Player 2 joins the game
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::WaitingForPlayer,
            ErrorCode::GameAlreadyStarted
        );

        game_escrow.player2 = ctx.accounts.player2.key();
        game_escrow.status = GameStatus::InProgress;

        // Transfer SOL from player2 to escrow
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.player2.key(),
                &game_escrow.key(),
                game_escrow.wager_amount,
            ),
            &[
                ctx.accounts.player2.to_account_info(),
                game_escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        msg!("Player 2 joined game: {}", game_escrow.game_id);
        Ok(())
    }

    /// Complete the game and pay out winner
    pub fn complete_game(
        ctx: Context<CompleteGame>,
        winner_is_player1: bool,
    ) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::InProgress,
            ErrorCode::GameNotInProgress
        );

        // Determine winner
        let winner = if winner_is_player1 {
            game_escrow.player1
        } else {
            game_escrow.player2
        };

        game_escrow.winner = winner;
        game_escrow.status = GameStatus::Completed;

        // Calculate total payout (both wagers)
        let total_payout = game_escrow.wager_amount * 2;

        // Transfer winnings to winner
        **game_escrow.to_account_info().try_borrow_mut_lamports()? -= total_payout;
        **ctx.accounts.winner.try_borrow_mut_lamports()? += total_payout;

        msg!("Game {} completed. Winner: {}", game_escrow.game_id, winner);
        Ok(())
    }

    /// Cancel game if player 2 never joins
    pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::WaitingForPlayer,
            ErrorCode::CannotCancelStartedGame
        );

        // Check if enough time has passed (e.g., 10 minutes)
        let current_time = Clock::get()?.unix_timestamp;
        let time_elapsed = current_time - game_escrow.created_at;
        require!(time_elapsed > 600, ErrorCode::CancellationTooEarly);

        // Refund player 1
        **game_escrow.to_account_info().try_borrow_mut_lamports()? -= game_escrow.wager_amount;
        **ctx.accounts.player1.try_borrow_mut_lamports()? += game_escrow.wager_amount;

        game_escrow.status = GameStatus::Cancelled;

        msg!("Game {} cancelled and refunded", game_escrow.game_id);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(game_id: String)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = player1,
        space = 8 + GameEscrow::MAX_SIZE,
        seeds = [b"game", game_id.as_bytes()],
        bump
    )]
    pub game_escrow: Account<'info, GameEscrow>,
    #[account(mut)]
    pub player1: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game_escrow: Account<'info, GameEscrow>,
    #[account(mut)]
    pub player2: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteGame<'info> {
    #[account(mut)]
    pub game_escrow: Account<'info, GameEscrow>,
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelGame<'info> {
    #[account(mut)]
    pub game_escrow: Account<'info, GameEscrow>,
    #[account(mut)]
    pub player1: Signer<'info>,
}

#[account]
pub struct GameEscrow {
    pub game_id: String,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub wager_amount: u64,
    pub status: GameStatus,
    pub winner: Pubkey,
    pub created_at: i64,
}

impl GameEscrow {
    pub const MAX_SIZE: usize = 32 + // game_id
        32 + // player1
        32 + // player2
        8 +  // wager_amount
        1 +  // status
        32 + // winner
        8;   // created_at
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameStatus {
    WaitingForPlayer,
    InProgress,
    Completed,
    Cancelled,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Game has already started")]
    GameAlreadyStarted,
    #[msg("Game is not in progress")]
    GameNotInProgress,
    #[msg("Cannot cancel a game that has already started")]
    CannotCancelStartedGame,
    #[msg("Must wait longer before canceling")]
    CancellationTooEarly,
}

