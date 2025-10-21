import type { CardResponse } from './services/dto/account.types';
import { cardTranslations, translate } from './utils/translations';
 

function showCardPropertie(
  key: string,
  value: string | undefined,
  keysStyles?:string ,
  valuesStyle?:string 
): React.ReactNode {
  return (
    <div key={key}>
      <dt className={`  ${keysStyles}`}>{key}</dt>
      <dd className={`  ${valuesStyle}`}>{value}</dd>
    </div>
  );
}
function displayCardResponseComponent(card: CardResponse, containerStyle?:string, keysStyles?:string, valuesStyle?:string) {
  return (
    <>
      <dl className={` ${containerStyle}`}>
        {card && (
          // if they are cards in the account then display them
            <>
            {Object.entries(card).map(([key, value]) => {
              if(key ==='id' ){return <></>}
              if (key === 'penalties') {
              return showCardPropertie(translate<CardResponse>(key as keyof CardResponse, cardTranslations), value?.toString(), keysStyles, valuesStyle);
              }
              if (key === 'spentLimit') {
              return (value as number >= Number.MAX_VALUE )
                ? showCardPropertie(translate<CardResponse>(key as keyof CardResponse, cardTranslations), 'Indefinido', keysStyles, valuesStyle)
                : showCardPropertie(translate<CardResponse>(key as keyof CardResponse, cardTranslations), value?.toString(), keysStyles, valuesStyle);
              }
              return showCardPropertie(translate<CardResponse>(key as keyof CardResponse, cardTranslations), value?.toString(), keysStyles, valuesStyle);
            })}
            </>
        )}
      </dl>
      
    </>
  );
}
export default displayCardResponseComponent
