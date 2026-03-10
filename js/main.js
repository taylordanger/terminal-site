// Main portfolio JS: Winbox mounts, GitHub repo fetching, and external-image embedding

console.log('main.js loaded');
console.log('pdfjsLib loaded?', !!window.pdfjsLib);

const whoamiBtn = document.querySelector("#whoami");
const repositoriesBtn = document.querySelector("#repositories");
const demosBtn = document.querySelector("#demos");
const resumeBtn = document.querySelector("#resumeBtn");

const aboutWhoami = document.querySelector("#about-whoami");
const aboutRepositories = document.querySelector("#about-repositories");
const aboutDemos = document.querySelector("#about-demos");
const aboutResume = document.querySelector("#about-resume");

const githubUsernameInput = document.querySelector("#github-username");
const githubTokenInput = document.querySelector("#github-token");
const saveTokenCheckbox = document.querySelector("#save-token");
const fetchReposBtn = document.querySelector("#fetch-repos");
const githubReposNodes = document.querySelectorAll("#github-repos");

const imageUrlsTextarea = document.querySelector("#image-urls");
const embedImagesBtn = document.querySelector("#embed-images");
const externalImagesDiv = document.querySelector("#external-images");

function openWinbox(title, mountEl) {
    new WinBox({
        title,
        width: "700px",
        height: "618vh",
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
        mount: mountEl,
        border: true,
        borderColor: "#000",
        borderwidth: "2px",
        background: "#000",

        onfocus: function () {
            this.setBackground("#0f0");
    }
}
);
    // If the mounted element contains a terminal-style pre, animate its typing
    // delay slightly to ensure Winbox has mounted the element into the DOM
    setTimeout(() => {
        try {
            animateTerminal(mountEl);
        } catch (e) {
            /* ignore */
        }
    }, 220);
}

    if (whoamiBtn && aboutWhoami) whoamiBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log('whoami clicked');
    aboutWhoami.classList.add('mounted');
    aboutWhoami.style.visibility = 'visible';
    aboutWhoami.style.height = 'auto';
    openWinbox("Whoami", aboutWhoami);
});
    if (repositoriesBtn && aboutRepositories) repositoriesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    aboutRepositories.classList.add('mounted');
    aboutRepositories.style.visibility = 'visible';
    aboutRepositories.style.height = 'auto';
    openWinbox("Repositories", aboutRepositories);
});
    if (demosBtn && aboutDemos) demosBtn.addEventListener("click", (e) => {
    e.preventDefault();
    aboutDemos.classList.add('mounted');
    aboutDemos.style.visibility = 'visible';
    aboutDemos.style.height = 'auto';
    openWinbox("Demos", aboutDemos);
});
    // Resume button behavior (with debug logging and fallback)
    if (resumeBtn) resumeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log('resume clicked');
        if (!aboutResume) {
            console.warn('aboutResume node not found; opening raw PDF');
            window.open('assets/resume.pdf', '_blank');
            return;
        }
        // Ensure mount visible
        aboutResume.classList.add('mounted');
        aboutResume.style.visibility = 'visible';
        aboutResume.style.height = 'auto';

        // Ensure there's a terminal pre to type into
        let pre = aboutResume.querySelector('.terminal-block');
        if (!pre) {
            pre = document.createElement('pre');
            pre.className = 'terminal-block';
            pre.textContent = 'Loading resume...';
            aboutResume.appendChild(pre);
        } else {
            pre.textContent = 'Loading resume...';
        }

        // Open the window immediately (will mount the node)
        try {
            console.log('attempting openWinbox for resume');
            openWinbox("Resume", aboutResume);
        } catch (err) {
            console.error('openWinbox failed:', err);
        }

        // Asynchronously load resume text: prefer a pre-extracted TXT file, fall back to pdf.js
        (async () => {
            try {
                const txtUrl = 'assets/resume.txt';
                let text = null;
                // Try loading plain text first (fast, avoids pdf.js issues)
                try {
                    const r = await fetch(txtUrl, { cache: 'no-cache' });
                    if (r.ok) {
                        text = await r.text();
                        console.log('Loaded resume text from', txtUrl, 'length=', (text && text.length) || 0);
                    } else {
                        console.log('No resume.txt found (status)', r.status);
                    }
                } catch (e) {
                    console.warn('Error fetching resume.txt:', e && e.message);
                }

                // If no text file, attempt PDF extraction (may fail in some browsers/OS)
                if (!text) {
                    try {
                        const url = 'assets/resume.pdf';
                        console.log('Falling back to pdf extraction for', url);
                        text = await extractPdfText(url);
                        console.log('pdf extraction succeeded, length=', (text && text.length) || 0);
                    } catch (pdfErr) {
                        console.warn('PDF text extraction failed:', pdfErr && pdfErr.message ? pdfErr.message : pdfErr);
                    }
                }

                if (text) {
                    pre.dataset.full = text;
                    pre.textContent = '';
                    pre.dataset.typed = 'false';
                    // re-run animateTerminal to type the loaded resume
                    animateTerminal(aboutResume, 10);
                } else {
                    pre.textContent = 'Failed to load resume text. Opening PDF as fallback.';
                    // leave the PDF link available for manual open
                    console.warn('No resume text available; user can open the PDF directly.');
                }
            } catch (err) {
                console.error('Unexpected error loading resume text:', err);
                pre.textContent = 'Unexpected error loading resume text.' + (err && err.message ? '\n' + err.message : '');
            }
        })();
    });

// GitHub fetching
async function fetchRepos(username) {
    if (!username) return renderRepos([]);
    try {
        const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`;
        const headers = { Accept: "application/vnd.github.v3+json" };
        const token = (githubTokenInput && githubTokenInput.value && githubTokenInput.value.trim()) || localStorage.getItem("github_token") || "";
        if (token) headers.Authorization = `token ${token}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const data = await res.json();
        renderRepos(data);
    } catch (err) {
        // Provide a helpful message if rate limited
        if (err.message && err.message.includes("403")) {
            renderError("Rate limited by GitHub API. Try adding a personal access token in the Repositories panel.");
        } else {
            renderError(err.message);
        }
    }
}

function renderError(message) {
    githubReposNodes.forEach((node) => {
        node.innerHTML = `<div style="color:tomato">${message}</div>`;
    });
}

function renderRepos(repos) {
    const html = repos
        .map((r) => {
            return `
                <div class="repo-card" style="border:1px solid #0f0;padding:8px;margin:8px 0;border-radius:4px;">
                    <a href="${r.html_url}" target="_blank" style="color:#0f0;font-weight:bold">${r.name}</a>
                    <div style="font-size:0.9em;color:#9f9">${r.description || ""}</div>
                    <div style="margin-top:6px;font-size:0.85em;color:#6f6">
                        ${r.stargazers_count} • ${r.language || ""} • Updated ${new Date(r.updated_at).toLocaleDateString()}
                    </div>
                </div>
            `;
        })
        .join("");

    githubReposNodes.forEach((node) => (node.innerHTML = html || "<div>No repos found.</div>"));

    // Add a small reveal animation to repo cards
    setTimeout(() => {
        githubReposNodes.forEach((node) => {
            node.querySelectorAll('.repo-card').forEach((c, i) => {
                setTimeout(() => c.classList.add('visible'), i * 50);
            });
        });
    }, 50);
}

// External image embedding
function embedImageUrls(urls) {
    externalImagesDiv.innerHTML = "";
    urls.forEach((u) => {
        const url = u.trim();
        if (!url) return;
        const wrapper = document.createElement("div");
        wrapper.style.margin = "8px 0";
        const img = document.createElement("img");
        img.src = url;
        img.alt = url;
        img.style.maxWidth = "100%";
        img.style.border = "1px solid #0f0";
        img.onerror = () => {
            wrapper.innerHTML = `<div style=\"color:tomato\">Failed to load: ${url}</div>`;
        };
        wrapper.appendChild(img);
        externalImagesDiv.appendChild(wrapper);
    });
}

// Typing animation for terminal-like pre blocks
function animateTerminal(container, speed = 12) {
    if (!container) return;
    console.log('animateTerminal called, container:', container && container.id);
    let pre = container.querySelector && container.querySelector('.terminal-block');
    // If Winbox moved the node or the container doesn't contain it anymore,
    // fall back to finding the first visible terminal-block in the document.
    if (!pre) {
        const all = Array.from(document.querySelectorAll('.terminal-block'));
        pre = all.find((el) => el.offsetWidth > 0 || el.offsetHeight > 0) || all[0];
    }
    if (!pre) return;
    console.log('terminal pre found:', pre);
    // If already typed, do a quick flash instead
    if (pre.dataset.typed === 'true') {
        pre.classList.add('typed-flash');
        // remove after animation ends (with fallback)
        pre.addEventListener('animationend', function _rem() {
            pre.classList.remove('typed-flash');
            pre.removeEventListener('animationend', _rem);
        }, { once: true });
        setTimeout(() => pre.classList.remove('typed-flash'), 900);
        return;
    }

    // prefer an explicit dataset.full (used when we load text asynchronously)
    const full = (pre.dataset && pre.dataset.full) || pre.textContent || '';
    pre.dataset.full = full;
    pre.textContent = '';
    pre.dataset.typed = 'false';
    let i = 0;
    const timer = setInterval(() => {
        pre.textContent += full.charAt(i);
        pre.scrollTop = pre.scrollHeight;
        i++;
        if (i >= full.length) {
            clearInterval(timer);
            pre.dataset.typed = 'true';
            console.log('typing finished');
            // flash to indicate typing completed
            pre.classList.add('typed-flash');
            pre.addEventListener('animationend', function _end() {
                pre.classList.remove('typed-flash');
                pre.removeEventListener('animationend', _end);
            }, { once: true });
            // fallback removal in case animationend doesn't fire
            setTimeout(() => pre.classList.remove('typed-flash'), 900);
        }
    }, speed);
}

// Extract text from a PDF using pdf.js
async function extractPdfText(url) {
    if (!window['pdfjsLib']) throw new Error('pdfjsLib not loaded');
    // set worker src to CDN worker
    window['pdfjsLib'].GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    const loadingTask = window['pdfjsLib'].getDocument(url);
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strs = content.items.map((it) => it.str || '').join(' ');
        fullText += strs + '\n\n';
    }
    return fullText.trim();
}


// Events
if (fetchReposBtn && githubUsernameInput) {
    fetchReposBtn.addEventListener("click", () => {
        // Persist token if requested
        if (saveTokenCheckbox && githubTokenInput) {
            if (saveTokenCheckbox.checked && githubTokenInput.value.trim()) {
                localStorage.setItem("github_token", githubTokenInput.value.trim());
            } else {
                localStorage.removeItem("github_token");
            }
        }
        fetchRepos(githubUsernameInput.value.trim());
    });
}

if (embedImagesBtn && imageUrlsTextarea) {
    embedImagesBtn.addEventListener("click", () => {
        const lines = imageUrlsTextarea.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        embedImageUrls(lines);
    });
}

// Auto-fetch for initial username if present
// Restore token preference
if (githubTokenInput) {
    const saved = localStorage.getItem("github_token");
    if (saved) {
        githubTokenInput.value = saved;
        if (saveTokenCheckbox) saveTokenCheckbox.checked = true;
    }
}

const defaultUser = (githubUsernameInput && githubUsernameInput.value) || "";
if (defaultUser) fetchRepos(defaultUser);
