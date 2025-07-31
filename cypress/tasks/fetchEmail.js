const Imap = require('imap');
const { simpleParser } = require('mailparser');
const cheerio = require('cheerio');
require('dotenv').config();


const fetchLatestEmail = () => {
    return new Promise((resolve, reject) => {
        const imap = new Imap({
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD,
            host: process.env.IMAP_SERVER,
            port: 993,
            tls: true,
        });

        function openInbox(cb) {
            imap.openBox('INBOX', true, cb);
        }

        imap.once('ready', () => {
            openInbox((err) => {
                if (err) return reject(err);

                imap.search(['ALL'], (err, results) => {
                    if (err || !results.length) return reject('No emails found');

                    const latestEmailId = results[results.length - 1];
                    const f = imap.fetch(latestEmailId, { bodies: '' });

                    f.on('message', (msg) => {
                        msg.on('body', (stream) => {
                            simpleParser(stream, (err, parsed) => {
                                if (err) return reject(err);
                                resolve(parsed.textAsHtml || parsed.html || parsed.text);
                            });
                        });
                    });

                    f.once('error', reject);
                    f.once('end', () => imap.end());
                });
            });
        });

        imap.once('error', reject);
        imap.connect();
    });
};

const extractTokenFromEmail = async (linkText = "Accept invite") => {
    const emailBody = await fetchLatestEmail();
    const $ = cheerio.load(emailBody);

    let foundLink = null;

    $('p').each((i, el) => {
        const paragraphText = $(el).text().toLowerCase();
        const link = $(el).find('a[href]');
        const href = link.attr('href');

        console.log(`\n[${i}] Paragraph: "${paragraphText}"`);
        console.log(`[${i}] Link href: "${href}"`);

        if (paragraphText.includes(linkText.toLowerCase()) && href) {
            foundLink = href;
            return false; // breaks out of .each()
        }
    });

    if (!foundLink) {
        throw new Error(`Link containing text: '${linkText}' not found.`);
    }
    return foundLink;
};

const extractInviteLinkFromEmail = async () => {
    return await extractTokenFromEmail("Accept invite");
}

const extractCreateNewPasswordToken = async () => {
    return await extractTokenFromEmail("Create new password");
}

module.exports = {
    extractInviteLinkFromEmail,
    extractCreateNewPasswordToken
};