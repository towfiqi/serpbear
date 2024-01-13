import Icon from '../common/Icon';

type KeywordPositionProps = {
   position: number,
   updating?: boolean,
   type?: string,
}

const KeywordPosition = ({ position = 0, type = '', updating = false }:KeywordPositionProps) => {
   if (!updating && position === 0) {
      return <span className='text-gray-400' title='Not in Top 100'>{'>100'}</span>;
   }
   if (updating && type !== 'sc') {
      return <span title='Updating Keyword Position'><Icon type="loading" /></span>;
   }
   return <>{Math.round(position)}</>;
};

export default KeywordPosition;
