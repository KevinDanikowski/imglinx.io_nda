import React, { Component } from 'react'
import { graphql, compose } from 'react-apollo'
import {UPDATE_IMAGE_MUTATION} from "./DashboardCreateAlbum";
import {ALBUM_IMAGES_QUERY, DELETE_ALBUM_MUTATION} from "./Album";
import {DELETE_IMAGE_MUTATION} from './DashboardCreateAlbum'
import {USER_ALBUMS_QUERY} from "./DashboardHome";
import gql from "graphql-tag";
import ImageDragAndDrop from './ImageDragAndDrop'
import ImageDropzone from './ImageDropzone';
import ImageLinkList from './ImageLinkList';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import {faCopy, faEye, faArrowLeft, faTrash} from '@fortawesome/fontawesome-free-solid'

class DashboardEditAlbum extends Component {
    constructor(props) {
        super(props)
        this.state = {
            addedImages: [],
            loadingImages: [],
            nameChanged: false,
            orderChanged: false,
            album: JSON.parse(localStorage.getItem('selected_album')) || {},
            albumId: JSON.parse(localStorage.getItem('selected_album')).id || null,
            albumName: JSON.parse(localStorage.getItem('selected_album')).name || 'error, no name...'
        }
    }
    componentWillReceiveProps(newProps){
        if(!newProps.albumImagesQuery.loading){
            this.setState({addedImages: newProps.albumImagesQuery.albumImages})
        }
    }
    render() {
        const date = new Date(this.state.album.dateCreated)
        const updateDate = new Date(this.state.album.dateUpdated)
        const readableDate = (date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear()+' at '+date.getHours()+':'+date.getMinutes()
        const readableUpdatedDate = (updateDate.getMonth()+1)+'/'+updateDate.getDate()+'/'+updateDate.getFullYear()+' at '+updateDate.getHours()+':'+updateDate.getMinutes()
        const ImageList = () => {
            return ("Direct Type")
        };
        const LoadingImages = () => {
            return this.state.loadingImages.map((image, index) => {
                return(
                    <div key={index} className="col-6 col-md-2 mt-3">
                        <div className="preloadImage">
                            <img src={image.url}
                                 style={{maxHeight: '150px', width: '100%', opacity: '0.5'}}
                            />
                            <div className="rainbowBar"/>
                        </div>
                    </div>
                )
            })
        };


        return (
            /*
            TODO: Remove comma in each array of the image
             */
            <div className='container mt-3 mb-5'>
                <div className="row mb-3">
                    <div className="col-12 col-md-2 mb-2 mb-md-0">
                        <Link to='/dashboard/home' className="btn btn-primary btn-block"><FontAwesomeIcon icon={faArrowLeft}/> Home</Link>
                    </div>
                    <div className="col-12 col-md-10">
                        <h2>Album <u>{this.state.album.name}</u></h2>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th><ImageList/></th>
                                    <th>Forum Type</th>
                                    <th>HTML Type</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <th>800x600</th>
                                    <th><ImageLinkList urlType='url800x600' linkType='direct' addedImages={this.state.addedImages}/></th>
                                    <th><ImageLinkList urlType='url800x600' linkType='forum' addedImages={this.state.addedImages}/></th>
                                    <th><ImageLinkList urlType='url800x600' linkType='html' addedImages={this.state.addedImages}/></th>
                                </tr>
                                <tr>
                                    <th>1600x1200</th>
                                    <th><ImageLinkList urlType='url1600x1200' linkType='direct' addedImages={this.state.addedImages}/></th>
                                    <th><ImageLinkList urlType='url1600x1200' linkType='forum' addedImages={this.state.addedImages}/></th>
                                    <th><ImageLinkList urlType='url1600x1200' linkType='html' addedImages={this.state.addedImages}/></th>
                                </tr>
                                <tr>
                                    <th>Original</th>
                                    <th><ImageLinkList urlType='url' linkType='direct' addedImages={this.state.addedImages}/></th>
                                    <th><ImageLinkList urlType='url' linkType='forum' addedImages={this.state.addedImages}/></th>
                                    <th><ImageLinkList urlType='url' linkType='html' addedImages={this.state.addedImages}/></th>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="row mt-3 mb-3">
                    <div className="col-6">
                        <h3>Album Images</h3>
                    </div>
                    <div className="col-6">
                        {(this.state.orderChanged) ?
                            <div className="d-flex justify-content-end">
                                <button onClick={this._saveImageOrder} className="btn btn-success">Save Changes</button>
                                <button onClick={this._resetImageOrder} className='btn btn-danger ml-1'>Reset Changes</button>
                            </div> : null}
                    </div>

                    <LoadingImages/>

                    <div className="col-12">
                        <div className="card mt-3">
                            <ImageDragAndDrop addedImages={this.state.addedImages}
                                              receiveNewImageOrder={this._updateImageOrder}
                                              receiveDeletedImage={this._deleteImage}/>
                        </div>
                    </div>

                    <div className="col-12 mt-3">
                        <h6>Add More Images</h6>
                        <div className="card" style={{height: '100px'}}>
                            <ImageDropzone albumId={this.state.albumId}
                                           userId={this.props.userId}
                                           receiveNewImage={this._addNewImageToState}
                                           receiveLoadingImageSignal={this._adjustLoadingImages}/>
                        </div>
                    </div>

                    <div className="col-12 mt-3">
                        <div className="input-group">
                            <div className="input-group-prepend">
                                <span className="input-group-text">Change Name</span>
                            </div>
                            <input
                                className=''
                                onChange={(e) => {
                                    this.setState({albumName: e.target.value});
                                    (this.state.album.name !== e.target.value)
                                        ? this.setState({nameChanged: true}) : this.setState({nameChanged: false})
                                }}
                                value={this.state.albumName}/>
                            {(this.state.nameChanged) ? <div className="input-group-append"><button
                                onClick={this._updateAlbum}
                                className="btn btn-outline-success"
                                type="button">Update Name</button></div> : null}
                        </div>
                    </div>

                    <div className="col-12 mt-3">
                        <div className="list-group">
                            <div className="list-group-item list-group-item-action disabled">Created on {readableDate}</div>
                            <div className="list-group-item list-group-item-action disabled">Updated on {readableUpdatedDate}</div>
                            <div className="list-group-item list-group-item-action disabled">Album Id {this.state.albumId}</div>
                            <div className="list-group-item list-group-item-action disabled">User id {this.props.userId}</div>
                        </div>
                    </div>

                    <div className="col-12 mt-3">
                        <button onClick={this._deleteAlbum} className="btn btn-danger btn-block"><FontAwesomeIcon icon={faTrash}/> Delete Album</button>
                    </div>
                </div>
            </div>
        )
    }
    _updateAlbum = async () =>{
        await this.props.updateAlbumMutation({
            variables: {
                albumId: this.state.albumId,
                name: this.state.albumName
            },
            update: (store, {data: {updateAlbum}}) => {
                this.state.album.name = this.state.albumName
                localStorage.setItem('selected_album', JSON.stringify(this.state.album))
                this.setState({
                    album: this.state.album,
                    albumName: this.state.album.name,
                    nameChanged: false
                })
                const data = store.readQuery({
                    query: USER_ALBUMS_QUERY,
                    variables: {userId: this.props.userId}
                })
                const updatedAlbumIndex = data.userAlbums.map(album=>album.id).indexOf(this.state.albumId)
                data.userAlbums.splice(updatedAlbumIndex, 1, updateAlbum)
                store.writeQuery({
                    query: USER_ALBUMS_QUERY,
                    variables: {userId: this.props.userId},
                    data
                })
            }
        })
    }
    _deleteAlbum = async () => {
        const confirmMessage = (this.state.album.images.length = 1) ?
            'Delete Album '+this.state.album.name+'? This will also delete '+this.state.album.images.length.toString()+' image!' :
            'Delete Album '+this.state.album.name+'? This will also delete '+this.state.album.images.length.toString()+' images!'
        if(window.confirm(confirmMessage)) {
            await this.props.deleteAlbumMutation({
                variables: {
                    albumId: this.state.albumId,
                    userId: this.props.userId
                },
                update: (store, {data: {deleteAlbum}}) => {
                    console.log('deleted', deleteAlbum)
                    const data = store.readQuery({
                        query: USER_ALBUMS_QUERY,
                        variables: {userId: this.props.userId}
                    })
                    const deletedAlbumIndex = data.userAlbums.map(album=>album.id).indexOf(this.props.albumId)
                    data.userAlbums.splice(deletedAlbumIndex, 1)
                    store.writeQuery({
                        query: USER_ALBUMS_QUERY,
                        variables: {userId: this.props.userId},
                        data
                    })
                }
            })
        }//todo history push
    }
    _adjustLoadingImages = (imageUrl, done) => {
        if(done){
            const unloadIndex = this.state.loadingImages.map(image=>image.url).indexOf(imageUrl)
            this.state.loadingImages.splice(unloadIndex, 1)
            this.setState({loadingImages: this.state.loadingImages})
        } else {
            this.state.loadingImages.push({url: imageUrl})
            this.setState({loadingImages: this.state.loadingImages})
        }
    }
    _addNewImageToState = (returnImage) => {
        let newAddedImagesArray = Array.from(this.state.addedImages)
        newAddedImagesArray.push(returnImage)
        this.setState({addedImages: newAddedImagesArray})
    }
    _saveImageOrder = async () => {
        this.setState({ orderChanged: false })
        const images = this.state.addedImages
        await images.map((image, index)=>{
            this.props.updateImageMutation({
                variables: {
                    imageId: image.id,
                    order: index
                }
            })
        })
        this.props.albumImagesQuery.refetch()
    }
    _updateImageOrder = (addedImages) => {
        this.setState({ addedImages: addedImages, orderChanged: true })
    }
    _resetImageOrder = () => {
        this.setState({addedImages: this.props.albumImagesQuery.albumImages})
    }
    _deleteImage = async (imageId, imageName) => {
        const imageIndex = this.state.addedImages.map(image => image.id).indexOf(imageId)
        const newImageArray = Array.from(this.state.addedImages)
        newImageArray.splice(imageIndex, 1)
        this.setState({addedImages: this.state.addedImages})
        await this.props.deleteImageMutation({
            variables: {
                imageId: imageId,
                albumId: this.state.albumId,
                name: imageName
            },
            update: (store, {data: {deleteImage}}) => {
                const data = store.readQuery({
                    query: ALBUM_IMAGES_QUERY,
                    variables: {albumId: this.state.albumId}
                })
                const deletedImageIndex = data.albumImages.map(image=>image.id).indexOf(imageId)
                data.albumImages.splice(deletedImageIndex, 1)
                store.writeQuery({
                    query: ALBUM_IMAGES_QUERY,
                    variables: {albumId: this.state.albumId},
                    data
                })
            }
        })
        console.log('deleted!')
    }
}
const UPDATE_ALBUM_MUTATION = gql`
mutation UpdateAlbumMutation($albumId: String!, $name: String!) {
    updateAlbum(name: $name, id: $albumId) {
        id name dateCreated dateUpdated createdBy images
}}`
export default compose(
    graphql(USER_ALBUMS_QUERY, {
        name: 'userAlbumsQuery',
        skip: (ownProps) => ownProps.userId === null,
        options: (ownProps) => {
            return { variables: {userId: ownProps.userId} }
        }}),
    graphql(DELETE_ALBUM_MUTATION, {name: 'deleteAlbumMutation'}),
    graphql(UPDATE_ALBUM_MUTATION, {name: 'updateAlbumMutation'}),
    graphql(DELETE_IMAGE_MUTATION, {name: 'deleteImageMutation'}),
    graphql(UPDATE_IMAGE_MUTATION, {name: 'updateImageMutation'}),
    graphql(ALBUM_IMAGES_QUERY, {
        name: 'albumImagesQuery',
        skip: (ownProps) => JSON.parse(localStorage.getItem('selected_album')).id === null,
        options: (ownProps) => {
            const albumId = JSON.parse(localStorage.getItem('selected_album')).id
            return { variables: {albumId: albumId} }
        }})
)(DashboardEditAlbum)