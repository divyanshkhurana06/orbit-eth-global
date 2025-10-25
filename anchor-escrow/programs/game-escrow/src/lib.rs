use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod game_escrow {
    use super::*;

    /// Initialize a new game with escrow
    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        game_id: String,
        wager_amount: u64,
    ) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(wager_amount > 0, ErrorCode::InvalidWagerAmount);
        require!(game_id.len() <= 32, ErrorCode::GameIdTooLong);

        game_escrow.game_id = game_id.clone();
        game_escrow.player1 = ctx.accounts.player1.key();
        game_escrow.player2 = Pubkey::default();
        game_escrow.wager_amount = wager_amount;
        game_escrow.status = GameStatus::WaitingForPlayer;
        game_escrow.winner = Pubkey::default();
        game_escrow.player1_attested = false;
        game_escrow.player2_attested = false;
        game_escrow.created_at = Clock::get()?.unix_timestamp;
        game_escrow.round_number = 1;
        game_escrow.player1_score = 0;
        game_escrow.player2_score = 0;
        game_escrow.bump = ctx.bumps.game_escrow;

        // Transfer SOL from player1 to escrow PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player1.to_account_info(),
                to: game_escrow.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, wager_amount)?;

        msg!("Game escrow initialized: {}", game_id);
        msg!("Player 1: {}", ctx.accounts.player1.key());
        msg!("Wager: {} lamports", wager_amount);

        Ok(())
    }

    /// Player 2 joins and deposits wager
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::WaitingForPlayer,
            ErrorCode::GameAlreadyStarted
        );
        require!(
            game_escrow.player1 != ctx.accounts.player2.key(),
            ErrorCode::CannotPlayAgainstSelf
        );

        game_escrow.player2 = ctx.accounts.player2.key();
        game_escrow.status = GameStatus::WaitingForReady;

        // Transfer SOL from player2 to escrow
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player2.to_account_info(),
                to: game_escrow.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, game_escrow.wager_amount)?;

        msg!("Player 2 joined: {}", ctx.accounts.player2.key());
        msg!("Total escrowed: {} lamports", game_escrow.wager_amount * 2);

        Ok(())
    }

    /// Player confirms they are ready
    pub fn player_ready(ctx: Context<PlayerReady>) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::WaitingForReady ||
            game_escrow.status == GameStatus::InProgress,
            ErrorCode::InvalidGameState
        );

        let signer = ctx.accounts.signer.key();
        
        if signer == game_escrow.player1 {
            game_escrow.player1_attested = true;
        } else if signer == game_escrow.player2 {
            game_escrow.player2_attested = true;
        } else {
            return Err(ErrorCode::UnauthorizedPlayer.into());
        }

        // If both players ready, start game
        if game_escrow.player1_attested && game_escrow.player2_attested {
            game_escrow.status = GameStatus::InProgress;
            msg!("Both players ready! Game started.");
        }

        Ok(())
    }

    /// Submit round result with attestation
    pub fn submit_round_result(
        ctx: Context<SubmitRoundResult>,
        winner_is_player1: bool,
    ) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::InProgress,
            ErrorCode::GameNotInProgress
        );

        let signer = ctx.accounts.signer.key();
        require!(
            signer == game_escrow.player1 || signer == game_escrow.player2,
            ErrorCode::UnauthorizedPlayer
        );

        // Update scores
        if winner_is_player1 {
            game_escrow.player1_score += 1;
        } else {
            game_escrow.player2_score += 1;
        }

        msg!("Round {} complete", game_escrow.round_number);
        msg!("Scores - P1: {} | P2: {}", game_escrow.player1_score, game_escrow.player2_score);

        // Check if match is complete (best of 3)
        if game_escrow.player1_score >= 2 || game_escrow.player2_score >= 2 {
            game_escrow.status = GameStatus::ReadyForPayout;
            
            if game_escrow.player1_score > game_escrow.player2_score {
                game_escrow.winner = game_escrow.player1;
            } else {
                game_escrow.winner = game_escrow.player2;
            }
            
            msg!("Match complete! Winner: {}", game_escrow.winner);
        } else {
            // Next round - reset ready status
            game_escrow.round_number += 1;
            game_escrow.player1_attested = false;
            game_escrow.player2_attested = false;
            msg!("Starting round {}", game_escrow.round_number);
        }

        Ok(())
    }

    /// Both players attest to the final result
    pub fn attest_result(ctx: Context<AttestResult>) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::ReadyForPayout,
            ErrorCode::InvalidGameState
        );

        let signer = ctx.accounts.signer.key();
        
        if signer == game_escrow.player1 {
            game_escrow.player1_attested = true;
        } else if signer == game_escrow.player2 {
            game_escrow.player2_attested = true;
        } else {
            return Err(ErrorCode::UnauthorizedPlayer.into());
        }

        msg!("Player {} attested to result", signer);

        // If both attested, allow payout
        if game_escrow.player1_attested && game_escrow.player2_attested {
            game_escrow.status = GameStatus::Completed;
            msg!("Both players attested. Ready for payout.");
        }

        Ok(())
    }

    /// Pay out winner (requires both player attestation)
    pub fn payout_winner(ctx: Context<PayoutWinner>) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::Completed,
            ErrorCode::NotReadyForPayout
        );
        require!(
            game_escrow.player1_attested && game_escrow.player2_attested,
            ErrorCode::BothPlayersMustAttest
        );

        let total_payout = game_escrow.wager_amount * 2;
        
        // Transfer from escrow to winner
        let seeds = &[
            b"game".as_ref(),
            game_escrow.game_id.as_bytes(),
            &[game_escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: game_escrow.to_account_info(),
                to: ctx.accounts.winner.to_account_info(),
            },
            signer_seeds,
        );
        system_program::transfer(cpi_context, total_payout)?;

        msg!("Paid out {} lamports to winner: {}", total_payout, game_escrow.winner);

        Ok(())
    }

    /// Cancel game if player 2 never joins (after timeout)
    pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
        let game_escrow = &mut ctx.accounts.game_escrow;
        
        require!(
            game_escrow.status == GameStatus::WaitingForPlayer,
            ErrorCode::CannotCancelStartedGame
        );
        require!(
            ctx.accounts.player1.key() == game_escrow.player1,
            ErrorCode::UnauthorizedPlayer
        );

        // Check timeout (10 minutes)
        let current_time = Clock::get()?.unix_timestamp;
        let elapsed = current_time - game_escrow.created_at;
        require!(elapsed > 600, ErrorCode::CancellationTooEarly);

        // Refund player 1
        let seeds = &[
            b"game".as_ref(),
            game_escrow.game_id.as_bytes(),
            &[game_escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: game_escrow.to_account_info(),
                to: ctx.accounts.player1.to_account_info(),
            },
            signer_seeds,
        );
        system_program::transfer(cpi_context, game_escrow.wager_amount)?;

        game_escrow.status = GameStatus::Cancelled;

        msg!("Game cancelled and refunded");

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(game_id: String)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = player1,
        space = 8 + GameEscrow::INIT_SPACE,
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
pub struct PlayerReady<'info> {
    #[account(mut)]
    pub game_escrow: Account<'info, GameEscrow>,
    
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitRoundResult<'info> {
    #[account(mut)]
    pub game_escrow: Account<'info, GameEscrow>,
    
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct AttestResult<'info> {
    #[account(mut)]
    pub game_escrow: Account<'info, GameEscrow>,
    
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct PayoutWinner<'info> {
    #[account(mut)]
    pub game_escrow: Account<'info, GameEscrow>,
    
    /// CHECK: Winner address from escrow
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelGame<'info> {
    #[account(mut)]
    pub game_escrow: Account<'info, GameEscrow>,
    
    #[account(mut)]
    pub player1: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct GameEscrow {
    #[max_len(32)]
    pub game_id: String,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub wager_amount: u64,
    pub status: GameStatus,
    pub winner: Pubkey,
    pub player1_attested: bool,
    pub player2_attested: bool,
    pub created_at: i64,
    pub round_number: u8,
    pub player1_score: u8,
    pub player2_score: u8,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum GameStatus {
    WaitingForPlayer,
    WaitingForReady,
    InProgress,
    ReadyForPayout,
    Completed,
    Cancelled,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid wager amount")]
    InvalidWagerAmount,
    
    #[msg("Game ID too long (max 32 characters)")]
    GameIdTooLong,
    
    #[msg("Game has already started")]
    GameAlreadyStarted,
    
    #[msg("Cannot play against yourself")]
    CannotPlayAgainstSelf,
    
    #[msg("Game is not in progress")]
    GameNotInProgress,
    
    #[msg("Cannot cancel a game that has already started")]
    CannotCancelStartedGame,
    
    #[msg("Must wait longer before canceling")]
    CancellationTooEarly,
    
    #[msg("Unauthorized player")]
    UnauthorizedPlayer,
    
    #[msg("Invalid game state for this operation")]
    InvalidGameState,
    
    #[msg("Not ready for payout")]
    NotReadyForPayout,
    
    #[msg("Both players must attest to the result")]
    BothPlayersMustAttest,
}

