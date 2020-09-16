const crypto = require("crypto");

//TODO: Maybe use a dedicated hashing algorithm instead? Something like node-argon2?
const randomString = function(len){
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex')
        .slice(0,len);
};
const sha256 = function(hashedPassword, salt){
    let hash = crypto.createHmac('sha256', salt);
    hash.update(hashedPassword);
    return hash.digest('hex')
};
const compareHash = function(dbHashedPassword, loginPassword, hashSalt) {
    return dbHashedPassword === sha256(loginPassword, hashSalt);
};

module.exports = {
    randomString: randomString,
    sha256: sha256,
    compareHash: compareHash
};