import React, { Component } from 'react'
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd'
import PropTypes from 'prop-types'

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};
const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    borderRadius: '0.25rem',
    border: '1px solid #dee2e6',
    overflow: 'hidden',
    margin: `0 0 8px 0`,
    display: 'flex',
    padding: '0.25rem',
    minHeight: '50px',

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'white',

    // styles we need to apply on draggables
    ...draggableStyle,
});
const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightgrey' : 'white',
    padding: 15,
    width: '100%',
});

class ImageDragAndDrop extends Component {
    constructor(props){
        super(props)
        this.state = {
            addedImages: this.props.addedImages
        }
        this.onDragEnd = this.onDragEnd.bind(this);
    }
    componentWillReceiveProps(newProps){
        if(newProps.addedImages !== this.state.addedImages){
            this.setState({addedImages: newProps.addedImages})
        }
    }

    onDragEnd(result) {
        if (!result.destination) {
            return;
        }

        const images = reorder(
            this.state.addedImages,
            result.source.index,
            result.destination.index
        )

        this.setState({
            addedImages: images,
        })
        this._passNewOrderToParent(images)
    }
    render() {
        const UploadedImages = () => {
            let images = this.state.addedImages;
            return images.map((image, index) => {
                const imageUrl800x600 = image.url800x600.replace(/s3.us-west-1/g,'s3-accelerate')
                return (
                    <Draggable key={image.id} draggableId={imageUrl800x600} index={index}>
                        {(provided, snapshot) => (
                            <div>
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={getItemStyle(
                                        snapshot.isDragging,
                                        provided.draggableProps.style
                                    )}
                                >
                                    <div className="col-2 col-md-1 d-flex justify-content-center align-items-center">
                                        <i className="fas fa-sort fa-2x"/>
                                    </div>
                                    <div className="col-2 d-flex align-items-center">
                                        <img style={{maxHeight: '50px'}} src={imageUrl800x600} alt=""/>
                                    </div>
                                    <div className="col-6 col-md-2 d-flex align-items-center">
                                        <p className="mb-0">Order: {index + 1}</p>
                                    </div>
                                    <div className="col-6 d-md-flex align-items-center d-none">
                                        <p className='mb-0' style={{fontSize: '8px'}}>{imageUrl800x600}</p>
                                    </div>
                                    <div className="col-2 col-md-1 d-flex align-items-center">
                                        <button onClick={() => this._deleteImage(image.id, image.name)}
                                                className="btn btn-danger"><i
                                            className="fas fa-trash-alt"/></button>
                                    </div>
                                </div>
                                {provided.placeholder}
                            </div>
                        )}
                    </Draggable>
                )
            })
        }

        return(
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}
                        >
                            <UploadedImages/>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        )
    }
    _passNewOrderToParent = (addedImages) => {
        this.props.receiveNewImageOrder(addedImages)
    }
    _deleteImage = (imageId, imageName) => {
        this.props.receiveDeletedImage(imageId, imageName)
    }
}

ImageDragAndDrop.propTypes = {
    addedImages: PropTypes.array,
    receiveNewImageOrder: PropTypes.func.isRequired,
    receiveDeletedImage: PropTypes.func.isRequired
}
export default ImageDragAndDrop