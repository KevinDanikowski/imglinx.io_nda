import React, { Component } from 'react'
import { graphql, compose } from 'react-apollo'
import { Link } from 'react-router-dom'
import gql from 'graphql-tag'
import PropTypes from 'prop-types'
import Album from './Album'
import {createFilter} from 'react-search-input'
import PaginationWrapper from './PaginationWrapper'

class DashboardHome extends Component {
    constructor(props){
        super(props)
        this.state = {
            albumSearchTerm: '',
            text: '',
            searchResults: null,
            totalItems: 1
        }
    }
    componentWillReceiveProps(newProps){
        if(newProps.userAlbumsQuery &&
            !newProps.userAlbumsQuery.loading &&
            !newProps.userAlbumsQuery.error &&
            this.state.albumSearchTerm.length < 1){
            this.setState({totalItems: newProps.userAlbumsQuery.userAlbums.length})
        }
    }
    render() {
        const albums = (this.props.userAlbumsQuery && !this.props.userAlbumsQuery.loading && !this.props.userAlbumsQuery.error)?
            this.props.userAlbumsQuery.userAlbums : []
        const preFilteredAlbums = (this.state.albumSearchTerm.length > 0)? albums.filter(createFilter(this.state.albumSearchTerm, ['name'])) : albums
        const skip = (this.props.page-1)*this.props.itemsPerPage
        const until = this.props.page*this.props.itemsPerPage
        const filteredAlbums = preFilteredAlbums.slice(skip,until)

        const AlbumsMap = () => {
            return filteredAlbums.map((album, index) => {
                return(
                    <Album
                        album={album}
                        albumId={album.id}
                        userId={this.props.userId}
                        key={album.id}
                        index={index} />
                )
            })
        }
        const CreateAlbum = () => {
            return (
                <div className="col-12 col-sm-6 col-lg-4 mt-3">
                    <Link to='/dashboard/createalbum' className='card h-100'>
                        <div className="card-body d-flex flex-column justify-content-center align-self-center w-100">
                            <div className="">
                                <p className="text-center text-secondary"><i className="fa fa-plus fa-5x text-center"/><br/>Create New Album</p>
                            </div>
                        </div>
                    </Link>
                </div>
            )
        }

        return(
            <div className='container mt-3'>
                <div id='dashboard-header' className="row mb-2">
                    <div className="col-3">
                        <h2>Albums</h2>
                    </div>
                    <div className="col-6">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                onChange={(e)=>{
                                    this._passPaginationToParent(1)
                                    this._setNewPaginationTotal(e.target.value, albums)
                                }}
                                value={this.state.albumSearchTerm}
                                placeholder="Search for Albumn"
                                aria-label="Recipient's username"
                                aria-describedby="basic-addon2" />
                            <div className="input-group-append">
                                <button className="btn btn-primary" type="button">Search</button>
                            </div>
                        </div>
                    </div>
                    <div className="col-3">
                        <select className="form-control"
                                defaultValue={this.props.itemsPerPage}
                                onChange={(e)=>this._passPaginationToParent(null, parseInt(e.target.value))}>
                            <option value="20">Items Per Page</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
                <PaginationWrapper  receivePagination={this._passPaginationToParent}
                                    itemsPerPage={this.props.itemsPerPage}
                                    page={this.props.page}
                                    totalItemsCount={this.state.totalItems}/>
                <div className="row">
                    <CreateAlbum />
                    <AlbumsMap />
                </div>
                <div className="mb-5" />
                <PaginationWrapper  receivePagination={this._passPaginationToParent}
                                    itemsPerPage={this.props.itemsPerPage}
                                    page={this.props.page}
                                    totalItemsCount={this.state.totalItems}/>
                <div className="mb-5" />
            </div>
        )
    }
    _passPaginationToParent = (page, itemsPerPage, totalItems) => {
        const newPage = (page)? page: this.props.page
        const newItemsPerPage = (itemsPerPage)? itemsPerPage: this.props.itemsPerPage
        this.props.receivePagination(newPage, newItemsPerPage, totalItems)
    }
    _setNewPaginationTotal = async (albumSearchTerm, albums) => {
        await this.setState({albumSearchTerm: albumSearchTerm})
        const newTotal = albums.filter(createFilter(albumSearchTerm, ['name'])).length
        if(albumSearchTerm.length === 0){
            this.setState({totalItems: this.props.userAlbumsQuery.userAlbums.length})
        } else {
            if (newTotal === albums.length) {
                this.setState({totalItems: 0})
            } else {
                this.setState({totalItems: newTotal})
            }
        }
    }
}

export const USER_ALBUMS_QUERY = gql`
query userAlbumsQuery($userId: String!){
    userAlbums(userId: $userId){
        id name dateCreated dateUpdated createdBy images
}}`

DashboardHome.propTypes = {
    page: PropTypes.number,
    itemsPerPage: PropTypes.number,
    receivePagination: PropTypes.func.isRequired
}

export default compose(
    graphql(USER_ALBUMS_QUERY, {
        name: 'userAlbumsQuery',
        skip: (ownProps) => ownProps.userId === null,
        options: (ownProps) => {
            return { variables: {
                userId: ownProps.userId,
                }
            }
        }})
)(DashboardHome)