const GameSession = require("../models/GameSession");

/**
 * Generates a unique 6-character game code
 * @returns {Promise<string>} A unique game code
 */
exports.generateUniqueGameCode = async () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed easily confused characters like O/0, I/1
  const codeLength = 6;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    let code = "";
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }

    // Check if code already exists
    const existingSession = await GameSession.findOne({ code });
    if (!existingSession) {
      return code; // Code is unique, return it
    }

    attempts++;
  }

  // If we reach here, we couldn't generate a unique code after several attempts
  throw new Error(
    "Failed to generate a unique game code after multiple attempts"
  );
};
