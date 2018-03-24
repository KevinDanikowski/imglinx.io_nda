import React, { Component } from 'react'
import {graphql, compose} from "react-apollo/index"
import gql from "graphql-tag"
import Dropzone from 'react-dropzone'
import PropTypes from 'prop-types'
import {USER_ALBUMS_QUERY} from "./DashboardHome";
import {ALBUM_IMAGES_QUERY} from "./Album";

class ImageDropzone extends Component {
    render() {
        return(
            <Dropzone
                onDrop={this._onDrop.bind(this)}
                className='image-dropzone'
                activeClassName='bg-green'
                multiple={true}
                onDropRejected={this._onDropRejected}
                maxSize={100000000}
                accept="image/jpeg, image/png">
                <i className="fa fa-picture-o text-secondary" aria-hidden="true"/> &nbsp;&nbsp;&nbsp;
                Drop a file here
            </Dropzone>
        )
    }
    _onDropRejected = () => {
        window.confirm('Maximum file upload size is 100MB')
    }

    _onDrop = async (acceptedFiles, rejectedFiles) => {
        acceptedFiles.map((imageFile, index) => {
            const uploadImage = async () => {
                this._sendLoadingSignal(imageFile.preview, false)
                
                console.log('about to upload image')
                await this.props.uploadImageMutation({
                    variables: {file: imageFile, albumId: this.props.albumId},
                    update: (store, {data: {uploadImage}}) => { //add imageId to album
                        this._sendLoadingSignal(imageFile.preview, true)

                        const returnImage = {
                            id: uploadImage.id,
                            name: uploadImage.name,
                            fileType: uploadImage.fileType,
                            url: uploadImage.url,
                            url800x600: uploadImage.url800x600,
                            url1600x1200: uploadImage.url1600x1200,
                            albumId: this.props.albumId,
                            __typename: 'Image'
                        }
                        const data = store.readQuery({
                            query: USER_ALBUMS_QUERY,
                            variables: {userId: this.props.userId}
                        })
                        const currentAlbumIndex = data.userAlbums.map(album=>album.id).indexOf(this.props.albumId)
                        if(currentAlbumIndex >= 0){ //add image id if album present
                            const updatedAlbum = Object.assign({}, JSON.parse(JSON.stringify((data.userAlbums[currentAlbumIndex]))))

                            updatedAlbum.images.push(uploadImage.id)
                            data.userAlbums.splice(currentAlbumIndex, 0, updatedAlbum)
                            store.writeQuery({
                                query: USER_ALBUMS_QUERY,
                                variables: {userId: this.props.userId},
                                data
                            })
                        }
                        // else { //add album if wasn't already
                        //     const addAlbum = this.props.album
                        //     addAlbum.images.push(uploadImage.id)
                        //     data.userAlbums.push(addAlbum)
                        //     store.writeQuery({
                        //         query: USER_ALBUMS_QUERY,
                        //         variables: {userId: this.props.userId},
                        //         data
                        //     })
                        // }

                        const updateAlbumImagesQuery = () => {
                            const data = store.readQuery({
                                query: ALBUM_IMAGES_QUERY,
                                variables: {albumId: this.props.albumId},
                            })
                            data.albumImages.push(returnImage)
                            store.writeQuery({
                                query: ALBUM_IMAGES_QUERY,
                                variables: {albumId: this.props.albumId},
                                data
                            })
                        }
                        updateAlbumImagesQuery()
                        console.log('added', returnImage)
                        this._sendNewImageToParent(returnImage)
                    }
                })
            };
            uploadImage()
        })
    }
    _sendNewImageToParent = (returnImage) => {
        this.props.receiveNewImage(returnImage)
    }
    _sendLoadingSignal = (imageUrl, done) => {
        this.props.receiveLoadingImageSignal(imageUrl, done)
    }

}
ImageDropzone.propTypes = {
    albumId: PropTypes.string,
    userId: PropTypes.string,
    album: PropTypes.object,
    receiveNewImage: PropTypes.func.isRequired
}

const UPLOAD_IMAGE_MUTATION = gql`
mutation AddImageFileMutation ($file: Upload!, $albumId: String!) {
    uploadImage(file: $file, albumId: $albumId){
        id name fileType url albumId url800x600 url1600x1200
}}`
export default compose(
    graphql(UPLOAD_IMAGE_MUTATION, {name: 'uploadImageMutation'}),
    graphql(USER_ALBUMS_QUERY, {
        name: 'userAlbumsQuery',
        skip: (ownProps) => ownProps.userId === null,
        options: (ownProps) => {
            return { variables: {userId: ownProps.userId} }
        }}),
    graphql(ALBUM_IMAGES_QUERY, {
        name: 'albumImagesQuery',
        skip: (ownProps) => ownProps.albumId === null || undefined,
        options: (ownProps) => {
            const albumId = ownProps.albumId
            return { variables: {albumId: albumId} }
        }})
)(ImageDropzone)