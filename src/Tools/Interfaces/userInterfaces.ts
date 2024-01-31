interface Image {
  url: string;
  height: number;
  width: number;
}

interface Followers {
  href: string;
  total: number;
}

interface ExternalUrls {
  spotify: string;
}

export interface User {
  display_name: string;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  type: string;
  uri: string;
}