export function getSessionId() {
  if (typeof window === "undefined") return null;

  const key = "np_session_id";
  let v = localStorage.getItem(key);

  if (!v) {
    v = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(key, v);
  }

  return v;
}

