const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

function testJwt() {
    try {
        const secret = process.env.JWT_SECRET;
        console.log(`JWT Secret exists: ${!!secret}`);
        if (!secret) throw new Error('JWT_SECRET is missing');

        const token = jwt.sign({ id: 123 }, secret, { expiresIn: '1h' });
        console.log('Token generated successfully:', token);

        const decoded = jwt.verify(token, secret);
        console.log('Token verified successfully:', decoded);

    } catch (err) {
        console.error('JWT Test Failed:', err.message);
    }
}

testJwt();
