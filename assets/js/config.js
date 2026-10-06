// Repositories/publications that should never be rendered, matched by name or DOI.
export const blacklist = Object.freeze({
    projects: ['gitthirteen.github.io', 'lightcraft', 'visualizations', 'compvis-tasks'],
    publications: []
});

// Repositories shown under the "Current" project filter, matched case-insensitively.
export const whitelist = Object.freeze({
    currentProjects: ['obsidian', 'saucebottle', 'ds-compare', 'lightcraft', 'visualizations']
});
