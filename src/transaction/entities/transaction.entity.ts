export class Transaction {
    _id: string
    points: number
    payer: string
    deprecated: boolean // deprecated means that the transaction's points wont be counted on retreival
    user: string
    timestamp: Date
}