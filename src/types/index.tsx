export interface Collection {
  _id: string;
  name: string;
  created_at: string;
  description: string;
  slug: string;
  discord_link?: string;
  twitter_link?: string;
  website_link?: string;
  collectionLive: boolean;
  tags: Array<string>;
  supply: number;
  status: string;
  featured: boolean;
  icon_type: string;
  inscription_icon: string;
  updated_at: string;
  varified: boolean;
  priority: number;
  verified: boolean;
}

export interface Inscription {
  title: string;
  id: string;
  timestamp: string;
  inscription_number: string;
  address: string;
  content_type: string;
  output: string;
  output_value: string;
  offset: string;
}

export interface Order {
  id: string; //unique id for each order
  inscriptionId: string; //inscxription id
  price: number; //price in btc
  signedPsbt: string; //signed psbt in base64 format
  createdAt: string; //date
  type: string; //order type buy/sell
  utxo: string; //inscription utxo
}

export interface UTXO {
  status: {
    block_hash: string;
    block_height: string;
    block_time: string;
    confirmed: boolean;
  };
  txid: string;
  value: number;
  vout: number;
}