import express from "express";
import bcrypt from "bcrypt";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const saltRounds = 10
const router = express.Router();

function validatePassword(password) {
    bcrypt
        .hash(password, saltRounds)
        .then(hash => {
            bcrypt
                .compare(password, hash)
                .then(res => {
                    return true;
                })
                .catch(err => console.error(err.message))
        })
        .catch(err => console.error(err.message))
}

router.post('/signin', (req, res) => {
    //TODO: Implement Signin
    //TODO: Check if email exists in DB
    
    //TODO: Validate password
    validatePassword(req.body.password)
});

router.post('/signout', (req, res) => {
    //TODO: Implement Sign Out
});

router.post('/signup', (req, res) => {
    console.log(req.body)
    //TODO: Add logic to hash password
    let userHash = "";
    bcrypt
        .hash(req.body.password, saltRounds)
        .then(hash => {
            userHash = hash
        })
        .catch(err => console.error(err.message))

    let result = db.collection("users").insertOne({
        "fullName": req.body.fullName,
        "email": req.body.email,
        "phone": req.body.phone,
        "branch": req.body.branch,
        "currYear": req.body.currYear,
        "yearOfJoining": req.body.yearOfJoining,
        "password": userHash,
        "acmMemberId": req.body.acmMemberId,
        "points": 0
    });
    res.send(result).status(200);
});

export default router;