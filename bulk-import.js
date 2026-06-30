import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const users = [];

async function importUsers() {
  try {
    // Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Read CSV
    fs.createReadStream("users.csv")
      .pipe(csv())
      .on("data", (row) => {
        users.push(row);
      })
      .on("end", async () => {
        try {
          const formattedUsers = [];

          for (const user of users) {
            // Skip if email already exists
            const exists = await User.findOne({ email: user.email });

            if (exists) {
              console.log(`Skipping ${user.email} (already exists)`);
              continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, 10);

            formattedUsers.push({
              name: user.name,
              email: user.email,
              password: hashedPassword,
            });
          }

          if (formattedUsers.length > 0) {
            await User.insertMany(formattedUsers);
            console.log(
              `${formattedUsers.length} users imported successfully.`,
            );
          } else {
            console.log("No new users to import.");
          }

          mongoose.connection.close();
        } catch (err) {
          console.error(err);
          mongoose.connection.close();
        }
      });
  } catch (err) {
    console.error(err);
  }
}

importUsers();