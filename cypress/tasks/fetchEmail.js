// const Imap = require('imap');
// const { simpleParser } = require('mailparser');
// const cheerio = require('cheerio');
// require('dotenv').config();
//
//
// const fetchLatestEmail = () => {
//     return new Promise((resolve, reject) => {
//         const imap = new Imap({
//             user: process.env.SMTP_USER,
//             password: process.env.SMTP_PASSWORD,
//             host: process.env.IMAP_SERVER,
//             port: 993,
//             tls: true,
//         });
//
//         function openInbox(cb) {
//             imap.openBox('INBOX', true, cb);
//         }
//
//         imap.once('ready', () => {
//             openInbox((err) => {
//                 if (err) return reject(err);
//
//                 imap.search(['ALL'], (err, results) => {
//                     if (err || !results.length) return reject('No emails found');
//
//                     const latestEmailId = results[results.length - 1];
//                     const f = imap.fetch(latestEmailId, { bodies: '' });
//
//                     f.on('message', (msg) => {
//                         msg.on('body', (stream) => {
//                             simpleParser(stream, (err, parsed) => {
//                                 if (err) return reject(err);
//                                 resolve(parsed.textAsHtml || parsed.html || parsed.text);
//                             });
//                         });
//                     });
//
//                     f.once('error', reject);
//                     f.once('end', () => imap.end());
//                 });
//             });
//         });
//
//         imap.once('error', reject);
//         imap.connect();
//     });
// };
//
// const extractTokenFromEmail = async (linkText = "Accept invite") => {
//     const emailBody = await fetchLatestEmail();
//     const $ = cheerio.load(emailBody);
//
//     let foundLink = null;
//
//     $('p').each((i, el) => {
//         const paragraphText = $(el).text().toLowerCase();
//         const link = $(el).find('a[href]');
//         const href = link.attr('href');
//
//         console.log(`\n[${i}] Paragraph: "${paragraphText}"`);
//         console.log(`[${i}] Link href: "${href}"`);
//
//         if (paragraphText.includes(linkText.toLowerCase()) && href) {
//             foundLink = href;
//             return false; // breaks out of .each()
//         }
//     });
//
//     if (!foundLink) {
//         throw new Error(`Link containing text: '${linkText}' not found.`);
//     }
//     return foundLink;
// };
//
// const extractInviteLinkFromEmail = async () => {
//     return await extractTokenFromEmail("Accept invite");
// }
//
// const extractCreateNewPasswordToken = async () => {
//     return await extractTokenFromEmail("Create new password");
// }
//
// module.exports = {
//     extractInviteLinkFromEmail,
//     extractCreateNewPasswordToken
// };





// Optimized version
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const cheerio = require('cheerio');
require('dotenv').config();

const fetchLatestEmail = ({ subjectKeyword = '', sinceDaysAgo = 1 } = {}) => {
    return new Promise((resolve, reject) => {
        const imap = new Imap({
            user: process.env.SMTP_USER,
            password: process.env.SMTP_PASSWORD,
            host: process.env.IMAP_SERVER,
            port: 993,
            tls: true,
            connTimeout: 30000,
        });

        imap.once('ready', () => {
            imap.openBox('INBOX', true, (err) => {
                if (err) return reject(err);

                const sinceDate = new Date();
                sinceDate.setDate(sinceDate.getDate() - sinceDaysAgo);
                const searchSince = sinceDate.toISOString().slice(0, 10);

                // Try UNSEEN first, fallback to SINCE
                imap.search(['UNSEEN'], (err, unseenResults) => {
                    const searchCriteria = (err || !unseenResults.length)
                        ? [['SINCE', searchSince]]
                        : ['UNSEEN'];

                    imap.search(searchCriteria, (err, results) => {
                        if (err || !results.length) {
                            return reject(new Error('No matching emails found.'));
                        }

                        const latestEmailId = results[results.length - 1];
                        const f = imap.fetch(latestEmailId, { bodies: '', markSeen: true });

                        f.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                simpleParser(stream, (err, parsed) => {
                                    if (err) return reject(err);
                                    if (
                                        subjectKeyword &&
                                        !parsed.subject?.toLowerCase().includes(subjectKeyword.toLowerCase())
                                    ) {
                                        return reject(
                                            new Error(`Email subject does not match: ${parsed.subject}`)
                                        );
                                    }

                                    const content = parsed.textAsHtml || parsed.html || parsed.text;
                                    if (!content) return reject(new Error('Email has no readable content'));
                                    resolve(content);
                                });
                            });
                        });

                        f.once('error', reject);
                        f.once('end', () => imap.end());
                    });
                });
            });
        });

        imap.once('error', reject);
        imap.connect();
    });
};


const extractLinkFromEmail = async (linkText = "Accept invite", options = {}) => {
    const emailBody = await fetchLatestEmail(options);
    if (!emailBody) throw new Error('No email content found.');

    const $ = cheerio.load(emailBody);
    const searchText = linkText.toLowerCase();
    let foundLink = null;

    // Strategy 1: Direct match on <a> text
    $('a[href]').each((_, el) => {
        const elText = $(el).text().trim().toLowerCase();
        const href = $(el).attr('href');

        if (!elText || !href) return;
        if ($(el).find('img').length > 0) return; // Skip logo/image anchors

        if (elText === searchText || elText.includes(searchText)) {
            foundLink = href;
            return false; // break
        }
    });

    // Strategy 2: Match parent elements (like <p>) that contain the search text, then get <a>
    if (!foundLink) {
        $('p, div, span, td').each((_, el) => {
            const text = $(el).text().trim().toLowerCase();
            if (text.includes(searchText)) {
                const href = $(el).find('a[href]').attr('href');
                if (href) {
                    foundLink = href;
                    return false; // break
                }
            }
        });
    }

    if (!foundLink) {
        throw new Error(`Could not find link containing or related to: '${linkText}'`);
    }
    return foundLink;
}

const extractInviteLinkFromEmail = async () => {
    return await extractLinkFromEmail("Accept invite");
}

const extractCreateNewPasswordToken = async () => {
    return await extractLinkFromEmail("Create new password");
}

module.exports = {
    extractInviteLinkFromEmail,
    extractCreateNewPasswordToken
};