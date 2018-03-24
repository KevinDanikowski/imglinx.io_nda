# www.imglinx.io (Portfolio Preview)

## What Is It?

Sites exist that will host your images, which is extremely helpful for e-commerce. However, these images use requests which hone to a central location, and anyone not near that database receive large images much slower. Therefore, by creating uploads and hosting through Amazon Web Services S3 Accelerator, these images are hosted around the world allowing a much quicker load time and increasing your chance that users will purchase your products.

# How Does It Work?

## Build:
- Front end: ReactJS, React Apollo, GraphQL
- Backend: ExpressJS, NodeJS, MongoDB, GraphQL
- Hosting: Digital Ocean, Nginx
- Other Relevant npm packages: auth0-js, axios, dotenv, express, font-awesome, jquery, mongoose, history, aws-sdk, s3-upload-stream, react-dropzone, react-js-pagination, react-beautiful-dnd, react-search-input, reactstrap, imagesize, sharp

## Login:
Uses auth0 authenticator and json web tokens (Oauth)

![Login Screen](https://github.com/KevinDanikowski/imglinx.io_nda/blob/master/misc/images/login-page.png?raw=true)

## Album Array:
Abilities:
- Search via album name
- Pagination

![Home Page](https://github.com/KevinDanikowski/imglinx.io_nda/blob/master/misc/images/home-albums-page-while-searching.png?raw=true)

## Uploading and Editing
Abilities:
- Drop in multiple images to simultaneously upload, then upload to amazon S3 in 3 different size formats
- Change the order of the images using a drag and drop feature
- Easy copy and past links in multiple formats for quick e-commerce use cases

![Create and Edit Albums](https://github.com/KevinDanikowski/imglinx.io_nda/blob/master/misc/images/edit-album-page.png?raw=true)

# Notes

This project's git is continually being updated, thus these files here cannot accurately reflect the project's current state.

# Authorship and Contributions

Kevin Danikowski (ReactJS, NodeJS)
- Designed and Created React Front End
- Designed and Created Node Back End
- Managed Auth0
- Launched on Digital Ocean
- Contact: kdanikowski@outlook.com

Roman Kovtun (CSS, HTML, ReactJS)
- Designed and Created CSS and Visuals
- Designed Idea
- Contributed to Design and Creation of Node Back End
- Contributed to Design and Creation of React Front End
- Managed Auth0
- Managed Client Communications

