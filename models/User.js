const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

//   FIXED pre-save hook – async + NO next() calls
userSchema.pre("save", async function () {
  // Only hash if password was modified (or is new)
  if (!this.isModified("password")) {
    return;
  }

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
  } catch (hashError) {
    console.error("Password hashing failed:", hashError);
    throw hashError;
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
