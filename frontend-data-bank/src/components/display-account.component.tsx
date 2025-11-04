import { useEffect, useState } from 'react';
import type { AccountResponse } from '../services/dto/account.types';
import {
  translate,
  accountTranslations,
  formatAccountValue,
} from '../utils/translations';

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
              <dt className={`${keyStyle}`}>
                {translate<AccountResponse>(
                  key as keyof AccountResponse,
                  accountTranslations,
                )}
              </dt>
              <dd className={`  ${valueStyle}`}>
                {formatAccountValue(key as keyof AccountResponse, value)}
              </dd>
            </div>
          ))}
      </div>
    </dl>
  ) : null;
}

export function displayAllAccountResponseComponent(
  account: AccountResponse,
  containerStyle?: string,
  keyStyle?: string,
  valueStyle?: string,
  keyValueStyle?: string,
): React.ReactNode {
  return account ? (
    <dl className={` ${containerStyle}`}>
      <div className={`${keyValueStyle}`}>
        {Object.entries(account).map(([key, value]) => (
          <div key={key}>
            <dt className={`${keyStyle}`}>
              {translate<AccountResponse>(
                key as keyof AccountResponse,
                accountTranslations,
              )}
            </dt>
            <dd className={`  ${valueStyle}`}>
              {formatAccountValue(key as keyof AccountResponse, value)}
            </dd>
          </div>
        ))}
      </div>
    </dl>
  ) : null;
}

export function displayAllAccountResponseComponentInput(
  account: AccountResponse,
  containerStyle?: string,
  keyStyle?: string,
  valueStyle?: string,
  keyValueStyle?: string,
  onValueChange?: (key: string, value: any) => void, // ✅ Accept any type
): React.ReactNode {
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (account) {
      const newValues: Record<string, any> = {};
      Object.entries(account).forEach(([key, value]) => {
        newValues[key] = value; 
      });
      setValues(newValues);
    }
  }, [account]);

  const handleInputChange = (key: string, newValue: any) => {
     
    let finalValue;
    if (key === 'isActive') {
      finalValue = Boolean(newValue);
    } else if (key === 'balance') {
      finalValue = parseFloat(newValue) || 0;
    } else {
      finalValue = newValue;
    }

    setValues(prev => ({
      ...prev,
      [key]: finalValue
    }));
    
    
    onValueChange?.(key, finalValue);
  };

  const getInputType = (key: string) => {
    if (key === 'balance') return 'number';
    if (key === 'isActive') return 'checkbox';
    return 'text';
  };

  return account ? (
    <dl className={` ${containerStyle}`}>
      <div className={`${keyValueStyle}`}>
        {Object.entries(account).map(([key, value]) => (
          <div key={key}>
            <dt className={`${keyStyle}`}>
              {translate<AccountResponse>(
                key as keyof AccountResponse,
                accountTranslations,
              )}
            </dt>
            {key === 'isActive' ? (
              <input
                type="checkbox"
                checked={Boolean(values[key])}
                onChange={(e) => handleInputChange(key, e.target.checked)}
                className="rounded"
              />
            ) : (
              <input
                className={`${valueStyle}`}
                type={getInputType(key)}
                value={values[key] ?? String(value)}
                onChange={(e) => handleInputChange(key, e.target.value)}
                step={key === 'balance' ? '0.01' : undefined}
                min={key === 'balance' ? '0' : undefined}
              />
            )}
          </div>
        ))}
      </div>
    </dl>
  ) : null;
}
export default displayAccountResponseComponent;
