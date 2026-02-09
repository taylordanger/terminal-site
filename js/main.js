const Whoami = document.querySelector("#whoami");
const Repositories = document.querySelector("#repositories");
const Demos = document.querySelector("#demos");
const aboutWhomai = document.querySelector("#about-whoami");
const aboutRepositories = document.querySelector("#about-repositories");
const aboutDemos = document.querySelector("#about-demos");

// Add event listeners to the buttons
Whoami.addEventListener("click", () => {
    const boutabe = new Winbox({
        title: "Whoami",
        width: "500px",
        height: "500px",
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
        mount: aboutWhomai,
    });
}

);
Repositories.addEventListener("click", () => {
    const boutabe = new Winbox({
        title: "Repositories",
        width: "500px",
        height: "500px",
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
        mount: aboutRepositories,
    });
});
Demos.addEventListener("click", () => {
    const boutabe = new Winbox({
        title: "Demos",
        width: "500px",
        height: "500px",
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
        mount: aboutDemos,
    });
});