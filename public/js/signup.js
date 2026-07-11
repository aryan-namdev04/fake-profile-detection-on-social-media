const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(signupForm);

    const userData = Object.fromEntries(formData.entries());

    console.log(userData);

    const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (result.success) {

        window.location.href = "/index.html";
    }
    else {
        alert(result.message);
    }
});