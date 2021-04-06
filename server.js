'use strict';

// const { render } = require('ejs');
require('dotenv').config()
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverRide = require('method-override');
const { del } = require('superagent');

const app = express();
const client = new pg.Client(process.env.DATABASE_URL);
const PORT = process.env.PORT || 3000;

// server.use(express.static('./public'));
app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(methodOverRide("_method"));


app.get('/', allBooks);
app.post('/books', addBook);
app.get('/books/:Id', getBook);
app.get('/searches/new', showBooks);
app.post('/searches', bookSearch);
app.get('*', (req, res) => res.status(404).send('This route does not exist'));


app.put('/books/update/:id', updateBook);
app.delete('/books/delete/:id', deleteBook);

// app.listen(PORT, () => console.log(`listen on PORT ${PORT}`));


function Book(info) {
    // const placeHolderImage = 'https://i.imgur.com/J5LVHEL.jpg';
    this.author = info.authors ? info.authors[0] : 'no authors available'
    this.title = info.title || 'No title available';
    this.isbn = info.industryIdentifiers[0].type + info.industryIdentifiers[0].identifier;
    this.img = info.imageLinks ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.description = info.description ? info.description : 'no description available'
}








function showBooks(req, res) {
    res.render('pages/searches/new');
}

function bookSearch(req, res) {


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



function allBooks(req, res) {
    let SQL = `SELECT * FROM library;`;
    client.query(SQL).then((results => {
        res.render('pages/index', { results: results.rows });
    })).catch(error => {
        error(error, res)
    })



}


function getBook(req, res) {
    const id = req.params.Id;
    let SQL = `SELECT * FROM library WHERE id=$1;`;
    let safeValues = [id];

    client.query(SQL, safeValues).then(results => {
        res.render('pages/books/detail', { result: results.rows })
    }).catch(error => {
        handleError(error, res)
    })
}


function addBook(req, res) {
    const sqlQuery = `INSERT INTO library (auther, title, isbn, image_url, description) VALUES($1, $2, $3,$4,$5);`;
    const value = req.body;
    let safeValues = [value.author, value.title, value.isbn, value.image_url, value.description];
    client.query(sqlQuery, safeValues).then((result) => {
        const getData = 'SELECT id FROM library WHERE isbn=$1';
        const safeValues = [value.isbn];
        client.query(getData, safeValues).then(result => {

            res.redirect(`/books/${result.rows[0].id}`);
        })
    })
}



function updateBook(req, res) {
    const id = req.params.id;
    const value = req.body;
    let safeValues = [value.auther, value.title, value.isbn, value.image_url, value.description];

    const updateLibrary = 'UPDATE library SET auther=$1, title=$2, isbn=$3, image_url=$4 description=$5 WHERE id=$6;';

    client.query(updateLibrary, safeValues).then(results => {
            res.redirect(`/books/${id}`);
        })
        // .catch(error, res);
}


function deleteBook(req, res) {
    const id = req.params.id;
    const idValues = [id];
    const deleteQuery = 'DELETE FROM library WHERE id=$1';
    client.query(deleteQuery, idValues).then(() => {
        res.redirect('/');
    }).catch(error => handleError(error, res));
}



client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(` ${PORT}`);
    });
});