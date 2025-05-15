document.addEventListener("DOMContentLoaded", function () {
  const joinForm = document.getElementById("join-game-form");

  if (joinForm) {
    joinForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const gameCode = document.getElementById("game-code").value;
      const nickname = document.getElementById("nickname").value;

      if (!gameCode || !nickname) {
        showError("Game code and nickname are required");
        return;
      }

      try {
        const response = await fetch("/game/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: gameCode, nickname: nickname }),
        });

        const data = await response.json();

        if (response.ok) {
          // Redirect to game lobby
          window.location.href = `/game/lobby/${gameCode}`;
        } else {
          showError(data.message || "Failed to join game");
        }
      } catch (error) {
        console.error("Error joining game:", error);
        showError("An error occurred. Please try again.");
      }
    });
  }

  function showError(message) {
    const errorElement = document.getElementById("join-error");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }
});
