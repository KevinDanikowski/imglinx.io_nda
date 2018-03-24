import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from 'react-router-dom'
import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { createUploadLink } from 'apollo-upload-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import './index.css'; // also using tachyons and boostrap (4) classes
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
import registerServiceWorker from './registerServiceWorker';
import {history} from './utils'

const API_URL = process.env.API_URL

const client = new ApolloClient({
    link: new createUploadLink({ uri: API_URL}),//link to graphql GUI
    cache: new InMemoryCache() //I think it make sure you can keep searching it
})

//BrowserRouter is to use switch in the Console.js file
ReactDOM.render(
    <Router history={history}>
        <ApolloProvider client={client}>
            <App client={client}/>
        </ApolloProvider>
    </Router>,
    document.getElementById('root'));
registerServiceWorker();
