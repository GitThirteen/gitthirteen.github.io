import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const CONFIG = {
    orcid: '0009-0009-9193-5277',
    githubUsername: process.env.GITHUB_REPOSITORY_OWNER || 'GitThirteen',
    outputPath: path.resolve(__dirname, '../assets/json/data.json'),
};

class Fetcher {
    constructor({ orcid, githubUsername, githubToken }) {
        this.orcid = orcid?.replace(/^https?:\/\/orcid\.org\//, '').trim();
        this.githubUsername = githubUsername?.trim();
        this.githubToken = githubToken;
    }

    async githubData() {
        if (!this.githubUsername) return [];

        const headers = {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'ProfileSync-Bot',
        };

        if (this.githubToken) {
            headers['Authorization'] = `Bearer ${this.githubToken}`;
        }

        const repos = [];
        let page = 1;

        while (true) {
            const url = `https://api.github.com/users/${encodeURIComponent(this.githubUsername)}/repos?per_page=100&page=${page}&sort=updated`;
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);

            const batch = await res.json();
            if (!Array.isArray(batch) || batch.length === 0) break;

            for (const repo of batch) {
                if (repo.fork || repo.archived) continue;

                repos.push({
                    id: repo.id,
                    name: repo.name,
                    description: repo.description,
                    url: repo.html_url,
                    homepage: repo.homepage || null,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    language: repo.language,
                    topics: repo.topics || [],
                    updatedAt: repo.pushed_at,
                });
            }

            if (batch.length < 100) break;
            page++;
        }

        return repos;
    }

    async orcidData() {
        if (!this.orcid) return [];

        const res = await fetch(`https://pub.orcid.org/v3.0/${this.orcid}/works`, {
            headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) throw new Error(`ORCID API error: ${res.status} ${res.statusText}`);

        const payload = await res.json();
        const groups = payload.group || [];
        const verified = [];

        const allowedTypes = [
            'conference-paper',
            'journal-article',
            'conference-proceedings',
            'book-chapter',
        ];

        for (const group of groups) {
            const summaries = group['work-summary'] || [];
            if (!summaries.length) continue;

            const valid = summaries.filter((s) => {
                if (!allowedTypes.includes(s.type)) return false;
                const source = s.source;
                const hasClientId = Boolean(source?.['source-client-id'] || source?.['assertion-origin-client-id']);
                const isSelf = source?.['source-orcid']?.path === this.orcid;
                return hasClientId && !isSelf;
            });

            if (!valid.length) continue;

            const summary = valid[0];
            const extIds = [
                ...(group['external-ids']?.['external-id'] || []),
                ...(summary['external-ids']?.['external-id'] || []),
            ];
            const doiObj = extIds.find((id) => id['external-id-type']?.toLowerCase() === 'doi');
            const doi = doiObj ? doiObj['external-id-value'] : null;

            if (!doi) continue;

            const dateObj = summary['publication-date'];
            const year = dateObj?.year?.value || null;

            verified.push({
                id: summary['put-code'],
                title: summary.title?.title?.value || 'Untitled',
                type: summary.type,
                year: year ? Number(year) : null,
                doi,
                url: `https://doi.org/${doi}`,
                source: summary.source?.['source-name']?.value || 'Verified Source',
            });
        }

        return verified.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    async allData() {
        const [publications, repositories] = await Promise.all([
            this.orcidData(),
            this.githubData(),
        ]);

        return {
            lastUpdated: new Date().toISOString(),
            publications,
            repositories,
        };
    }
}

(async () => {
    try {
        console.log(`Starting sync for ${CONFIG.githubUsername} & ORCID ${CONFIG.orcid}...`);

        const fetcher = new Fetcher({
            orcid: CONFIG.orcid,
            githubUsername: CONFIG.githubUsername,
            githubToken: process.env.GITHUB_TOKEN,
        });

        const data = await fetcher.allData();

        await mkdir(path.dirname(CONFIG.outputPath), { recursive: true });
        await writeFile(CONFIG.outputPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Successfully wrote ${data.publications.length} publications and ${data.repositories.length} repos to ${CONFIG.outputPath}`);
    } catch (err) {
        console.error('Sync failed:', err);
        process.exit(1);
    }
})();