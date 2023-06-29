import Button from 'Components/Button/index';
import Tips from 'Components/tips/fixed.jsx';
import React from 'react';
import Qiniu from 'react-qiniu';
import FixedTip from "../tips/fixed";
import PropTypes from "prop-types";
// const Qiniu = (props) => <div>{props.children}</div>

class UploadPage extends React.PureComponent {


    state = {
        files: [],
        token: 'YOUR_UPLOAD_TOKEN',
        uploadKey: 'YOUR_CUSTOM_UPLOAD_KEY', // Optional
        prefix: 'YOUR_QINIU_KEY_PREFIX' // Optional
    };

    onUpload =  (files) => {
        files.map(function (f) {
            f.onprogress = function(e) {
                console.log(e.percent);
            };
        });
    };

    onDrop =  (files) => {
        this.setState({
            files: files
        });
        console.log('Received files: ', files);
    };



    componentDidMount () {

    }

    render() {
        const {props} = this;
        return (
            <div>
                <Qiniu onDrop={this.onDrop} size={150} token={this.state.token}
                       uploadKey={this.state.uploadKey}
                       onUpload={this.onUpload}>
                    {props.children?props.children:<div>Try dropping some files here, or click to select files to upload.</div>}
                </Qiniu>
            </div>
        );
    }
}

UploadPage.propTypes = {
    children: PropTypes.object
};

export default UploadPage;