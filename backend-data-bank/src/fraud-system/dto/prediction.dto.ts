export class PredictionInput{
    Customer_ID: string
    Customer_Name: string
    Gender: string
    Age: number
    State: string
    City: string
    Bank_Branch: string
    Account_Type: string
    Transaction_ID: string
    Transaction_Date: string  
    Transaction_Time: string  
    Transaction_Amount: number
    Merchant_ID: string
    Transaction_Type: string
    Merchant_Category: string
    Account_Balance: number
    Transaction_Location: string   
    Transaction_Currency: string
    Customer_Contact: string
    Transaction_Description: string
    Customer_Email: string
    Transaction_Device: string
    IP_Address: string

}
export class PredictionOutput{
    prediction: number  
    probability_suspicious: number
    transaction_id: number
}   