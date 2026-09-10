export const THEME_STORAGE_KEY = "theme";

/** Runs in the root layout (Server Component) before paint — not inside a client tree. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t="light";var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);r.style.colorScheme=t}catch(e){}})();`;
