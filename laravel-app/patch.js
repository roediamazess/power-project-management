    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx');
        const path = `./Pages/${name}.jsx`;
        if (!pages[path]) {
            console.error(`Page not found: ${path}. Forcing reload to fetch new assets...`);
            window.location.href = window.location.href;
            return;
        }
        return typeof pages[path] === 'function' ? pages[path]() : pages[path];
    },
