// VERIFICA LOGIN
if (localStorage.getItem("logado") !== "true") {

    window.location.href = "login.html";
}

// LOGOUT
function logout() {

    localStorage.removeItem("logado");

    window.location.href = "login.html";
}
