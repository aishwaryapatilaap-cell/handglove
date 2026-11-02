// angles order: [thumb, index, middle, ring, little]. null = that sensor is not fitted / not calibrated.
export interface GloveReading { angles: (number | null)[]; raw: number | null; motor: string; calibrated: boolean }
export interface GloveEvent { event: string; angle?: number; raw?: number }
export interface GloveLink { send(cmd: string): void; close(): Promise<void> }
export interface GloveHandlers { onReading(r: GloveReading): void; onEvent(e: GloveEvent): void; onClosed(): void }
