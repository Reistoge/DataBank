import type { AccountResponse } from './services/dto/account.types';
import { translate, accountTranslations, formatAccountValue } from './utils/translations';
 
function displayAccountResponseComponent(
  account: AccountResponse,
  containerStyle?: string,
  keyStyle?: string,
  valueStyle?: string,
): React.ReactNode {
  return account ? (
    <dl className={` ${containerStyle}`}>
      <div>
        {Object.entries(account)
          .filter(([key]) => key !== 'id' && key !== 'userId')
          .map(([key, value]) => (
            <div key={key}>
              <dt className={`${keyStyle}`}>{translate<AccountResponse>(key as keyof AccountResponse,accountTranslations)}</dt>
              <dd className={`  ${valueStyle}`}>{formatAccountValue(key as keyof AccountResponse, value)}</dd>
            </div>
          ))}
      </div>
    </dl>
  ) : null;
}


 

export default displayAccountResponseComponent;
