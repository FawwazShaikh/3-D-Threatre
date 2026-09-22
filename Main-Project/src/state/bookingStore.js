import { create } from 'zustand';

/**
 * bookingStore — central state for seat selection.
 * Both SeatMap2D and SeatMap3D read/write this store.
 * Seat Sync broadcasts changes from this store to the room.
 */
const useBookingStore = create((set, get) => ({
  // Booking context
  titleId: null,
  showtimeId: null,
  auditoriumId: null,

  // View mode
  viewMode: '2d', // '2d' | '3d'
  cameraPreset: 'front-center',
  showScoreOverlay: false,

  // Seat states — keyed by seatId (e.g. "J2")
  selectedSeats: new Set(),       // seats I've picked
  bookedSeats: new Set(),         // permanently sold
  heldSeats: new Map(),           // seatId → { userId, expiresAt }
  friendPicks: new Map(),         // seatId → userId
  friendHovers: new Map(),        // seatId → userId (considering)

  // Participants in the room
  participants: new Map(),        // userId → { name, color, avatar, initial }
  myUserId: 'me-' + Math.random().toString(36).slice(2, 8),

  // Actions
  init: (titleId, showtimeId, auditoriumId) =>
    set({ titleId, showtimeId, auditoriumId }),

  setViewMode: (mode) => set({ viewMode: mode }),
  setCameraPreset: (preset) => set({ cameraPreset: preset }),
  setShowScoreOverlay: (show) => set({ showScoreOverlay: show }),

  selectSeat: (seatId) => set((state) => {
    const next = new Set(state.selectedSeats);
    if (next.has(seatId)) {
      next.delete(seatId);
    } else {
      // Can't select if booked, held by others, or picked by friend
      if (state.bookedSeats.has(seatId)) return state;
      if (state.heldSeats.has(seatId) && state.heldSeats.get(seatId).userId !== state.myUserId) return state;
      if (state.friendPicks.has(seatId)) return state;
      next.add(seatId);
    }
    return { selectedSeats: next };
  }),

  deselectSeat: (seatId) => set((state) => {
    const next = new Set(state.selectedSeats);
    next.delete(seatId);
    return { selectedSeats: next };
  }),

  clearSelection: () => set({ selectedSeats: new Set() }),

  // Seat Sync actions (called by realtime layer)
  setBookedSeats: (seats) => set({ bookedSeats: new Set(seats) }),

  addHold: (seatId, userId, expiresAt) => set((state) => {
    const next = new Map(state.heldSeats);
    next.set(seatId, { userId, expiresAt });
    return { heldSeats: next };
  }),

  removeHold: (seatId) => set((state) => {
    const next = new Map(state.heldSeats);
    next.delete(seatId);
    return { heldSeats: next };
  }),

  setFriendPick: (seatId, userId) => set((state) => {
    const next = new Map(state.friendPicks);
    next.set(seatId, userId);
    return { friendPicks: next };
  }),

  removeFriendPick: (seatId) => set((state) => {
    const next = new Map(state.friendPicks);
    next.delete(seatId);
    return { friendPicks: next };
  }),

  setFriendHover: (seatId, userId) => set((state) => {
    const next = new Map(state.friendHovers);
    next.set(seatId, userId);
    return { friendHovers: next };
  }),

  clearFriendHover: (seatId) => set((state) => {
    const next = new Map(state.friendHovers);
    next.delete(seatId);
    return { friendHovers: next };
  }),

  addParticipant: (userId, data) => set((state) => {
    const next = new Map(state.participants);
    next.set(userId, data);
    return { participants: next };
  }),

  removeParticipant: (userId) => set((state) => {
    const next = new Map(state.participants);
    next.delete(userId);
    // Also clean up their picks/hovers
    const fp = new Map(state.friendPicks);
    const fh = new Map(state.friendHovers);
    for (const [seat, uid] of fp) { if (uid === userId) fp.delete(seat); }
    for (const [seat, uid] of fh) { if (uid === userId) fh.delete(seat); }
    return { participants: next, friendPicks: fp, friendHovers: fh };
  }),

  /**
   * Get the display state for a seat.
   * Returns: 'available' | 'mine' | 'friend-pick' | 'friend-hover' | 'held' | 'booked'
   */
  getSeatState: (seatId) => {
    const s = get();
    if (s.bookedSeats.has(seatId)) return 'booked';
    if (s.selectedSeats.has(seatId)) return 'mine';
    if (s.friendPicks.has(seatId)) return 'friend-pick';
    if (s.friendHovers.has(seatId)) return 'friend-hover';
    if (s.heldSeats.has(seatId)) return 'held';
    return 'available';
  },

  /**
   * Get friend color for a seat
   */
  getFriendColor: (seatId) => {
    const s = get();
    const uid = s.friendPicks.get(seatId) || s.friendHovers.get(seatId);
    if (!uid) return null;
    const p = s.participants.get(uid);
    return p?.color || '#888';
  },
}));

export default useBookingStore;
