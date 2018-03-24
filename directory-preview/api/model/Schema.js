const fs = require('fs')
const ObjectID = require('mongodb').ObjectId
const {
    graphql,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLID,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull,
    GraphQLScalarType
} = require('graphql')
const sharp = require('sharp')
const imagesize = require('imagesize')
const axios = require('axios')
/****** AMAZON *****/
// import entire SDK
const AWS = require('aws-sdk');
// import individual service
const {S3_BUCKET} = require('../constants')

AWS.config.loadFromPath('./config.json')

const s3 = new AWS.S3()

const s3Stream = require('s3-upload-stream')(s3)
const folderOrigional = 'origional/'
const folder800x600 = '800x600/'
const folder1600x1200 = '1600x1200/'
const foldersArray = [folderOrigional, folder1600x1200, folder800x600]

/*~~~~~~~~~~~~~~~~~~~~~~~~
       Mongoose Schemas
~~~~~~~~~~~~~~~~~~~~~~~~~*/
const USER = require('./user')
const ALBUM = require('./album')
const IMAGE = require('./image')

/*~~~~~~~~~~~~~~~~~~~~~~~~
        Types
(this is remaking the mongoose schema but for graphql basically)
~~~~~~~~~~~~~~~~~~~~~~~~*/
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: {type: GraphQLID},
        email: {type: GraphQLString},
        dateCreated: {type: GraphQLString},
        albums: {type: new GraphQLList(GraphQLID)},
    })
})
const AlbumType = new GraphQLObjectType({
    name: 'Album',
    fields: () => ({
        id: {type:GraphQLID},
        name: {type:GraphQLString},
        dateCreated: {type: GraphQLString},
        dateUpdated: {type: GraphQLString},
        createdBy: {type: GraphQLID},
        images: {type: new GraphQLList(GraphQLID)},
    })
})
const ImageType = new GraphQLObjectType({
    name: 'Image',
    fields: () => ({
        id: {type:GraphQLID},
        name: {type: GraphQLString},
        fileType: {type: GraphQLString},
        dateCreated: {type: GraphQLString},
        url: {type: GraphQLString},
        url800x600: {type: GraphQLString},
        url1600x1200: {type: GraphQLString},
        order: {type: GraphQLInt},
        albumId: {type: GraphQLID}
    })
})
//from https://github.com/jaydenseric/apollo-upload-server/blob/master/src/types.mjs
const ImageScalarType = new GraphQLScalarType({
    name: 'Upload',
    description:
    'The `Upload` scalar type represents a file upload promise that resolves ' +
    'an object containing `stream`, `filename`, `mimetype` and `encoding`.',
    parseValue: value => value,
    parseLiteral() {
        console.log('Upload scalar literal unsupported')
    },
    serialize() {
        console.log('Upload scalar serialization unsupported')
    }
})

/*~~~~~~~~~~~~~~~~~~~~~~~~
        Functions
 ~~~~~~~~~~~~~~~~~~~~~~~~*/
const userList = () => {
    return new Promise((resolve, reject) => {
        USER.find((err, user) => {
            if(err) reject(err)
            else resolve(user)
        })
    })
}
const albumList = () => {
    return new Promise((resolve, reject) => {
        ALBUM.find((err, album) => {
            if(err) reject(err)
            else resolve(album)
        })
    })
}
const imageList = () => {
    return new Promise((resolve, reject) => {
        IMAGE.find((err, image) => {
            if(err) reject(err)
            else resolve(image)
        })
    })
}
const userAlbums = (userId, skip, limit) => {
    return ALBUM.find(({createdBy: {"$in": userId}})).sort({dateCreated: -1 }).skip((skip)?skip:0).limit((limit)?limit:0)
    //.skip().limit()
}
const albumImages = (albumId) => {
    return IMAGE.find({albumId: {"$in": albumId}}, null, {sort: {order: 1}})
}

/*~~~~~~~~~~~~~~~~~~~~~~~~
        Root Query
~~~~~~~~~~~~~~~~~~~~~~~~*/
const RootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        user: {
            type: UserType,
            args: {
                id: {type: GraphQLString},
                email: {type: GraphQLString}
            },
            resolve(parentValue, {id, email}) {
                if(id) {
                    return USER.findById(id)
                }
                if(email){
                    return USER.findOne({'email': email})
                }
            }
        },
        users: {
            type: new GraphQLList (UserType),
            resolve (parentalValue, args){
                return userList()
            }
        },
        album: {
            type: AlbumType,
            args: {
                id: {type: GraphQLString},
                email: {type: GraphQLString}
            },
            resolve(parentValue, {id}) {
                return ALBUM.findById(id)
            }
        },
        albums: {
            type: new GraphQLList (AlbumType),
            resolve (parentalValue, args){
                return albumList()
            }
        },
        userAlbums: {
            type: new GraphQLList (AlbumType),
            args: {
                userId: {type: new GraphQLNonNull(GraphQLString)},
                skip: {type: GraphQLInt},
                limit: {type: GraphQLInt}
            },
            resolve (parentalValue, args){
                return userAlbums(args.userId, args.skip, args.limit)
            }
        },
        image: {
            type: ImageType,
            args: {
                id: {type: GraphQLString}
            },
            resolve(parentValue, {id}){
                return IMAGE.findById(id)
            }
        },
        images: {
            type: new GraphQLList (ImageType),
            resolve (parentalValue, args){
                return imageList()
            }
        },
        albumImages: {
            type: new GraphQLList (ImageType),
            args: {
                albumId: {type: new GraphQLNonNull(GraphQLString)}
            },
            resolve (parentalValue, args){
                return albumImages(args.albumId)
            }
        }
    }
})


/*~~~~~~~~~~~~~~~~~~~~~~~~
        Mutations
~~~~~~~~~~~~~~~~~~~~~~~ */
const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser:{
            type: UserType,
            args: {
                id: {type: GraphQLString},
                email: {type: new GraphQLNonNull (GraphQLString)}
            },
            resolve(parentValue, args){
                const auth0Url = 'https://image-bucket.auth0.com/api/v2/users/user_id'
                const { auth0Id } = new Promise((resolve, reject)=>{
                    axios.get({
                        method: 'get',
                        url: auth0Url,
                        headers: { authorization: 'bearer you_id_token_here'}
                    }).then(res=>{

                    })
                })
                const newUser = new USER({
                    _id: args.id,
                    email: args.email,
                    auth0Id: auth0Id
                })
                return new Promise((resolve, reject)=>{
                    newUser.save(function(err){
                        if(err) reject(err)
                        else resolve(newUser)
                    })
                })
            }
        },
        deleteUser:{
            type: UserType,
            args: {
                id: {type: GraphQLString},
                email: {type: GraphQLString}
            },
            resolve(parentValue, args){
                console.log('about to delete user '+args.id)
                if(!args.id){
                    //query via email here to get ID
                }
                const userId = (args.id)?args.id:'USER_ID_HERE'
                return new Promise((resolve, reject) => {
                    // 1. get albums and delete each one
                    ALBUM.find({createdBy: {"$in": userId}}, 'id createdBy', (err,albums)=>{
                        if (err) reject(err)
                        else {
                            resolve()
                            return new Promise(async (resolve, reject) => {
                                console.log('about to send delete album query')
                                const schema = require('./Schema')
                                await albums.forEach(album=>{
                                    const query = 'mutation{deleteAlbum(id: \"'+album._id+'\", userId:\"'+userId+'\"){id}}'
                                    // 2. delete albums and their corresponding ID from user
                                    return graphql(schema, query)
                                })
                                // 3. remove user
                                USER.remove({_id: userId}, (err, user) => {
                                    if(err) reject(err)
                                    else {
                                        console.log('deleted user ', user)
                                        resolve()
                                    }
                                })
                            })
                        }
                    })
                })
            }
        },
        updateUser: {
            type: UserType,
            args: {
                id: {type: GraphQLString},
                email: {type: GraphQLString},
            },
            resolve(parentValue, args){
                return new Promise((resolve, reject) => {
                    const date = Date().toString()
                    USER.findOneAndUpdate(
                        {"_id": args.id},
                        { "$set":{email: args.email}},
                        {"new": true}
                    ).exec((err, res) => {
                        if(err) reject(err)
                        else resolve(res)
                    })
                })
            }
        },
        addAlbum:{
            type: AlbumType,
            args: {
                name: {type: new GraphQLNonNull (GraphQLString)},
                userId: {type: GraphQLString}
            },
            resolve(parentValue, args){
                const newAlbum = new ALBUM({
                    name: args.name,
                    createdBy: args.userId
                })
                return new Promise((resolve, reject)=>{
                    newAlbum.save(function(err, callback){
                        if(err) reject(err)
                        else {
                            resolve(newAlbum)
                            return new Promise((resolve, reject) => {
                                USER.findOneAndUpdate(
                                    {"_id": args.userId},
                                    {"$addToSet": {albums: [callback._id]}},
                                    {"new": true}
                                ).exec((err, res) => {
                                    if (err) reject(err)
                                    else resolve(res)
                                })
                            })
                        }
                    })
                })
            }
        },
        deleteAlbum:{
            type: AlbumType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)},
                userId: {type: new GraphQLNonNull(GraphQLString)}
            },
            resolve(parentValue, args){
                // First get all images
                return new Promise((resolve, reject) => {
                    //console.log(args.id, ' should be ', '5a90af57c2eb0c37771392c3') //id of album blank name before 'new'
                    // 1. get images
                    IMAGE.find({albumId: {"$in": args.id}}, 'id albumId url name', (err,images)=>{
                        if (err) reject(err)
                        else {
                            resolve()
                            return new Promise(async (resolve, reject) => {
                                const schema = require('./Schema')
                                await images.forEach(image=>{
                                    const query = 'mutation{deleteImage(id: \"'+image._id+'\", albumId:\"'+args.id+'\",name:\"'+image.name+'\"){id}}'
                                    // 2. delete images and their corresponding ID from album
                                    return graphql(schema, query)
                                })
                                // 3. remove album
                                ALBUM.remove({_id: args.id}, (err, callback) => {
                                    console.log('deleted album '+args.id)
                                    if(err) reject(err)
                                    else {
                                        resolve()
                                        return new Promise((resolve, reject) => {
                                            // 4. remove albumId from user
                                            console.log('removed album '+args.id+' from user '+args.userId)
                                            USER.findOneAndUpdate(
                                                {"_id": args.userId},
                                                {"$pull": {albums:{"$in": [args.id]}}},
                                                {"new": true}
                                            ).exec((err, res) => {
                                                if (err) reject(err)
                                                else resolve(res)
                                            })
                                        })
                                    }
                                })
                            })
                        }
                    })
                })
            }
        },
        updateAlbum: {
            type: AlbumType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)},
                name: {type: GraphQLString}
            },
            resolve(parentValue, args){
                return new Promise((resolve, reject) => {
                    const date = Date().toString()
                    ALBUM.findOneAndUpdate(
                        {"_id": args.id},
                        { "$set":{name: args.name, dateUpdated: date}},
                        {"new": true}
                    ).exec((err, res) => {
                        if(err) reject(err)
                        else resolve(res)
                    })
                })
            }
        },
        deleteImage:{
            type: ImageType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)},
                albumId: {type: new GraphQLNonNull(GraphQLString)},
                name: {type: new GraphQLNonNull(GraphQLString)}
            },
            resolve(parentValue, args){
                console.log('about to delete from s3')
                foldersArray.map(folder=>{
                    const params = {  Bucket: S3_BUCKET, Key: (folder+args.name) }
                    s3.deleteObject(params, function(err, data) {
                        if (err) console.log(err, err.stack)
                        else     console.log('deleted image '+folder+args.name+' from S3')
                    })
                })
                console.log('deleting image '+args.id)
                return new Promise((resolve, reject) => {
                    IMAGE.remove({_id: args.id}, (err, callback) => {
                        if(err) reject(err)
                        else {
                            resolve()
                            return new Promise((resolve, reject) => {
                                console.log('removing image '+args.id+' from album '+args.albumId)
                                ALBUM.findOneAndUpdate(
                                    {"_id": args.albumId},
                                    {"$pull": {images: {"$in": [args.id]}}},
                                    {"new": true}
                                ).exec((err, res) => {
                                    if (err) reject(err)
                                    else resolve(res)
                                })
                            })
                        }
                    })
                })
            }
        },
        updateImage: {
            type: ImageType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)},
                name: {type: GraphQLString},
                fileType: {type: GraphQLString},
                url: {type: GraphQLString},
                order: {type: GraphQLInt}
            },
            resolve(parentValue, args){
                let updates = {}
                if(args.name) updates.name = args.name
                if(args.fileType) updates.fileType = args.fileType
                if(args.url) updates.url = args.url
                if(args.order) updates.order = args.order

                return new Promise((resolve, reject) => {
                    IMAGE.findOneAndUpdate(
                        {"_id": args.id},
                        { "$set":updates},
                        {"new": true}
                    ).exec((err, res) => {
                        if(err) reject(err)
                        else resolve(res)
                    })
                })
            }
        },
        uploadImage: {
            type: ImageType,
            args: {
                albumId: {type: GraphQLString },
                file: {type: ImageScalarType}
            },
            resolve(parentValue, data){
                const storeFS = ({ stream, filename }) => {
                    const id = new ObjectID
                    console.log('added image with ID ', id)
                    const extensionNoPeriod = filename.split('.').pop()
                    const extension = '.'.concat(extensionNoPeriod)
                    const path = `./images/${id+extension}`
                    return new Promise((resolve, reject) =>
                        stream
                            .on('error', error => {
                                if (stream.truncated)
                                // Delete the truncated file
                                    fs.unlinkSync(path)
                                reject(error)
                            })
                            .on('end', () => resolve({ id, path }))
                            .pipe(fs.createWriteStream(path))
                    )
                }
                const findAspectRatio = (path) => {
                    return new Promise((resolve, reject)=>{
                        const readableImageStream = fs.createReadStream(path)
                        imagesize(readableImageStream, function (err, result) {
                            let positiveAspectRatio = false
                            if (err) {
                                console.log(err)
                                resolve({positiveAspectRatio})
                            }
                            if(result.height / result.width >= 0.75){
                                positiveAspectRatio = true
                            }
                            resolve({positiveAspectRatio})
                        })
                    })
                }
                const storeDB = (file, albumId) => {
                    const newImage = new IMAGE({//
                        _id: file.id,
                        name: file.name,
                        fileType: file.mimetype,
                        url: file.url,
                        url800x600: file.url800x600,
                        url1600x1200: file.url1600x1200,
                        albumId: albumId,
                        s3Bucket: file.s3Bucket,
                        s3ETag: file.s3ETag
                    })
                    return new Promise((resolve, reject) => {
                        //Save image to db
                        newImage.save(function (err, callback) {
                            if (err) reject(err)
                            else {
                                resolve(newImage)
                                return new Promise((resolve, reject) => {
                                    //Save image Id to album
                                    ALBUM.findOneAndUpdate(
                                        {"_id": albumId},
                                        {"$addToSet": {images: [callback._id]}},
                                        {"new": true}
                                    ).exec((err, res) => {
                                        console.log('updated album '+albumId+' with new image')
                                        if (err) reject(err)
                                        else resolve(res)
                                    })
                                })
                            }
                        })
                    })
                }
                const s3Upload = async (path, id, extension, positiveAspectRatio) => {
                    let amazonImageObject = {} //url, url800x600, url1600x1200, s3Bucket, name, s3ETag

                    const readableImageStream = fs.createReadStream(path)

                    const upload800x600 = new Promise((resolve, reject)=>{
                        const resizing = (positiveAspectRatio) ? sharp().resize(800, 600).crop() : sharp().resize(800)
                        readableImageStream
                            .pipe(resizing)
                            .pipe(
                                s3Stream.upload({
                                    "Bucket": S3_BUCKET,
                                    "Key": (folder800x600 + id.toString() + extension)
                                })
                                    .on('error', (err) => reject(err))
                                    .on('uploaded', (details) => {
                                        console.log('uploaded 800x600')
                                        amazonImageObject.url800x600 = details.Location
                                        resolve()
                                    })
                            )
                    })
                    const upload1600x1200 = new Promise((resolve, reject)=>{
                        const resizing = (positiveAspectRatio) ? sharp().resize(1600, 1200).crop() : sharp().resize(1600)
                        readableImageStream
                            .pipe(resizing)
                            .pipe(
                                s3Stream.upload({
                                    "Bucket": S3_BUCKET,
                                    "Key": (folder1600x1200 + id.toString() + extension)
                                })
                                    .on('error', (err) => reject(err))
                                    .on('uploaded', (details) => {
                                        console.log('uploaded 1600x1200')
                                        amazonImageObject.url1600x1200 = details.Location
                                        resolve()
                                    })
                            )
                    })
                    const uploadOrigional = new Promise((resolve, reject)=>{
                        readableImageStream
                            .pipe(
                                s3Stream.upload({
                                    "Bucket": S3_BUCKET,
                                    "Key": (folderOrigional + id.toString() + extension)
                                })
                                    .on('error', (err) => reject(err))
                                    .on('uploaded', (details) => {
                                        console.log('uploaded origional')
                                        amazonImageObject.url = details.Location
                                        amazonImageObject.s3Bucket = details.Bucket
                                        amazonImageObject.s3ETag = details.ETag
                                        amazonImageObject.name = id.toString()+extension
                                        resolve()
                                    })
                            )
                    })
                    console.log('about to upload to s3...', )
                    return Promise.all([
                        upload800x600, upload1600x1200, uploadOrigional
                    ]).then(res=>{
                        fs.unlink(path, function(err) {
                            if (err) console.log(err)
                            console.log('deleted image from '+path)
                        })
                        return amazonImageObject
                    }).catch(function(err) {console.log(err)})
                }

                const processUpload = async data => {
                    const { stream, filename, mimetype, encoding } = await data.file
                    const albumId = data.albumId
                    const extensionNoPeriod = filename.split('.').pop()
                    const extension = '.'.concat(extensionNoPeriod)
                    const { id, path } = await storeFS({ stream, filename })
                    const { positiveAspectRatio } = await findAspectRatio(path)
                    const {url, url800x600, url1600x1200, s3Bucket, s3ETag, name} = await s3Upload(path, id, extension, positiveAspectRatio)
                    console.log('name',name)
                    return storeDB({ id, url800x600, url1600x1200, name, mimetype, encoding, url, s3Bucket, s3ETag }, albumId)
                }

                return processUpload(data)
            }
        }
    }
})

/*~~~~~~~~~~~~~~~~~~~~~~~~
        EXPORTS
 ~~~~~~~~~~~~~~~~~~~~~~~~*/
module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation
})