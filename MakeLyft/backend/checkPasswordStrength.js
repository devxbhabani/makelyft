/**
 * Password Strength Checker
 * Usage: node checkPasswordStrength.js "YourPasswordHere"
 */

function checkPasswordStrength(password) {
    let score = 0;
    let feedback = [];

    if (!password) {
        return { score: 0, feedback: ["Password cannot be empty"], strength: "Weak" };
    }

    // Length check
    if (password.length > 8) {
        score += 1;
    } else {
        feedback.push("Password should be longer than 8 characters");
    }

    if (password.length >= 12) {
        score += 1;
    }

    // Lowercase and Uppercase check
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        score += 1;
    } else {
        feedback.push("Add both uppercase and lowercase letters");
    }

    // Number check
    if (/\d/.test(password)) {
        score += 1;
    } else {
        feedback.push("Add at least one number");
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 1;
    } else {
        feedback.push("Add at least one special character (e.g., !@#$%)");
    }

    // Determine strength label
    let strength = "Weak";
    if (score >= 4) {
        strength = "Strong";
    } else if (score === 3) {
        strength = "Medium";
    }

    return {
        score,
        strength,
        feedback
    };
}

// CLI Execution
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Please provide a password to check.");
        console.log("Usage: node checkPasswordStrength.js <password>");
        process.exit(1);
    }

    const testPassword = args[0];
    const result = checkPasswordStrength(testPassword);

    console.log(`\nPassword: ${"*".repeat(testPassword.length)}`);
    console.log(`Strength: ${result.strength} (${result.score}/5)`);
    
    if (result.feedback.length > 0) {
        console.log("\nTips to improve:");
        result.feedback.forEach(tip => console.log(` - ${tip}`));
    } else {
        console.log("\nGreat job! This is a strong password.");
    }
    console.log("\n");
}

module.exports = checkPasswordStrength;
