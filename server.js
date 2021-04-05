'use strict';

// const { render } = require('ejs');
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// server.use(express.static('./public'));
app.get('/', getTasks);
app.post('/add', addTask);
app.get('/library/: Id', getSingleTask);
const pg = require('pg');
app.use(cors());
app.use(express.static('./public'));
const client = new pg.Client(process.env.DATABASE_URL);
require('dotenv').config()
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.get('/', renderHomePage);
app.get('/searches/new', showForm);
app.post('/searches', createSearch);
app.get('*', (req, res) => res.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`listen on PORT ${PORT}`));


function Book(info) {
    // const placeHolderImage = 'https://i.imgur.com/J5LVHEL.jpg';
    this.author = info.authors ? info.authors[0] : 'no authors available'
    this.title = info.title || 'No title available';
    this.isbn = info.volumeInfo.industryIdentifiers[0].type + info.volumeInfo.industryIdentifiers[0].identifier;
    this.img = info.imageLinks ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.description = info.description ? info.description : 'no description available'
}






function renderHomePage(req, res) {
    res.render('pages/index')
}

function showForm(req, res) {
    res.render('pages/searches/new');
}

function createSearch(req, res) {


    const searchBy = req.body.searchBy;
    const searchValue = req.body.search;
    let url = `https://www.googleapis.com/books/v1/volumes?q=+in${searchBy}:${searchValue}`;
    const queryObj = {};
    if (searchBy === 'title') {
        queryObj['q'] = `intitle:${searchValue}`;
    } else if (searchBy === 'author') {
        queryObj['q'] = `inauthor:${searchValue}`;
    }

    superagent.get(url).then(apiResponse => {
        return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))

    }).then(results => {
        res.render('pages/show', { searchResults: results })
        console.log(results);
    })
}



function getTasks(req, res) {
    let SQL = `SELECT * FROM library;`;
    console.log(SQL);
    client.query(SQL).then((results => {
        res.render('pages/index', { results: results.rows });
    })).catch(error => {
        error(error, res)
    })



}


function getSingleTask(req, res) {
    const id = req.params.Id;
    let SQL = `SELECT * FROM library WHERE id=$1;`;
    let safeValues = [Id];

    client.query(SQL, safeValues).then(results => {
        res.render('pages/books/detail', { result: results.rows })
    }).catch(error => {
        handleError(error, res)
    })
}


function addTask(req, res) {
    const sqlQuery = `INSERT INTO books (auther, title, isbn, image_url, description) VALUES($1, $2, $3,$4,$5);`;
    const value = req.body;
    let safeValues = [value.author, value.title, value.isbn, value.image_url, value.description];
    client.query(sqlQuery, safeValues).then((result) => {
        res.redirect(`/books/${result.rows[0].id}`);
    })
}






client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(` ${PORT}`);
    });
});