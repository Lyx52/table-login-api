const crypto = require("crypto");

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
const hashPassword = function (pw_str) {
    return crypto.createHmac('sha256', pw_str).digest('hex');
}

module.exports = {
    randomString: randomString,
    sha256: sha256,
    compareHash: compareHash,
    hashPassword: hashPassword
};