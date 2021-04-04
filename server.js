'use strict';

const { render } = require('ejs');
const express = require('express');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT || 3000;

// server.use(express.static('./public'));

app.use(express.static('./public'));

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
    this.title = info.title || 'No title available';
    this.author = info.authors;
    // this.img = info.imageLinks ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
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
        queryObj['q'] = `+intitle:${searchValue}`;
    } else if (searchBy === 'author') {
        queryObj['q'] = `+inauthor:${searchValue}`;
    }

    superagent.get(url).then(apiResponse => {
        return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))

    }).then(results => {
        res.render('pages/show', { searchResults: results })
        console.log(results);
    })
}