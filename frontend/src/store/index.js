import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  
  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  
  updateUser: (userData) => {
    const updatedUser = { ...useAuthStore.getState().user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  }
}));

export const useEstablishmentStore = create((set) => ({
  establishment: JSON.parse(localStorage.getItem('establishment')) || null,
  
  setEstablishment: (establishment) => {
    localStorage.setItem('establishment', JSON.stringify(establishment));
    set({ establishment });
  },
  
  clearEstablishment: () => {
    localStorage.removeItem('establishment');
    set({ establishment: null });
  }
}));

export const usePlaylistStore = create((set) => ({
  requests: [],
  nowPlaying: null,
  playlist: [],
  
  setRequests: (requests) => set({ requests }),
  addRequest: (request) => set((state) => ({ 
    requests: [...state.requests, request] 
  })),
  updateRequest: (id, updates) => set((state) => ({
    requests: state.requests.map(r => r.id === id ? { ...r, ...updates } : r)
  })),
  removeRequest: (id) => set((state) => ({
    requests: state.requests.filter(r => r.id !== id)
  })),
  
  setNowPlaying: (song) => set({ nowPlaying: song }),
  setPlaylist: (playlist) => set({ playlist }),
  addToPlaylist: (song) => set((state) => ({ 
    playlist: [...state.playlist, song] 
  })),
  removeFromPlaylist: (id) => set((state) => ({
    playlist: state.playlist.filter(s => s.id !== id)
  }))
}));
