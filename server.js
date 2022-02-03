const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const format = require("date-fns/format");
const { v4: uuidv4 } = require("uuid");

const app = express();

const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get("/", (req, res) => {
    // server static html file
    res.sendFile(__dirname + "/index.html");
});

app.post("/", urlencodedParser, async (req, res) => {
    console.log("body:", req.body);
    // get data form request body
    const data = req.body;

    // get template html file
    const templateHtml = fs.readFileSync(
        path.resolve(__dirname, "./template/certificate.html"),
        "utf8"
    );

    // compile template
    const template = handlebars.compile(templateHtml);

    // Create buffer of the background image
    const bitmap = fs.readFileSync("./template/certificate.jpg");
    const base64image = new Buffer.from(bitmap).toString("base64");

    // Add remaining data
    data.src = "data:image/png;base64," + base64image;
    data.date = format(new Date(data.date), "MMM. yyyy");
    data.id = uuidv4();
    data.ref = Math.floor(1000 + Math.random() * 9000);

    // Add data to template
    const html = template(data);

    // Launch puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // We set the page content as the generated html by handlebars
    await page.setContent(html);

    // We use pdf function to generate the pdf in the same folder as this file.
    await page.pdf({
        path: "certificate.pdf",
        width: "1600px",
        height: "1200px",
        printBackground: true,
    });

    await browser.close();

    console.log("PDF Generated");

    // Send generated PDF
    res.sendFile(__dirname + "/certificate.pdf");
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Serer listening on port ${port}!`));
