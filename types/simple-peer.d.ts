declare module 'simple-peer' {
  import { EventEmitter } from 'events';

  namespace SimplePeer {
    interface Options {
      initiator?: boolean;
      channelConfig?: any;
      channelName?: string;
      config?: any;
      offerOptions?: any;
      answerOptions?: any;
      sdpTransform?: (sdp: string) => string;
      stream?: MediaStream;
      streams?: MediaStream[];
      trickle?: boolean;
      allowHalfTrickle?: boolean;
      wrtc?: any;
      objectMode?: boolean;
    }

    interface SignalData {
      type?: string;
      sdp?: string;
      candidate?: any;
    }
  }

  class SimplePeer extends EventEmitter {
    constructor(opts?: SimplePeer.Options);
    signal(data: SimplePeer.SignalData): void;
    send(data: any): void;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, stream: MediaStream): void;
    removeTrack(track: MediaStreamTrack, stream: MediaStream): void;
    destroy(err?: Error): void;
    
    on(event: 'signal', listener: (data: SimplePeer.SignalData) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: 'data', listener: (data: Buffer) => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'track', listener: (track: MediaStreamTrack, stream: MediaStream) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: Function): this;
  }

  export = SimplePeer;
}

