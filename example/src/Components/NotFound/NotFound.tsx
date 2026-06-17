import {FC} from 'react';

interface NotFoundProps {
    tagName: string;
}

const NotFound: FC<NotFoundProps> = ({tagName}) => {
    return `Component ${tagName} not found`;
};

export default NotFound;
