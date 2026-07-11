const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const formData = new FormData(loginForm);

    const userData = Object.fromEntries(formData.entries());

    const response = await fetch("/api/login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
        },

        body: JSON.stringify(userData),

    });

    const result = await response.json();

    if (result.success) {
        window.location.href = "/index.html";

    } else {
        alert(result.message);
    }

});