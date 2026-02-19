export interface LandlordMenuItem {
  label: string;
  href: string;
  description?: string;
}

export interface LandlordMenuColumn {
  title: string;
  items: LandlordMenuItem[];
}

export const LANDLORD_MENU: LandlordMenuColumn[] = [
  { title: 'Packages', items: [
    { label: 'Studio Package', href: '/landlord-solutions/packages?type=studio' },
    { label: '1 Bed Package', href: '/landlord-solutions/packages?type=1-bed' },
    { label: '2 Bed Package', href: '/landlord-solutions/packages?type=2-bed' },
    { label: 'HMO Package', href: '/landlord-solutions/packages?type=hmo' },
    { label: 'Student Let Package', href: '/landlord-solutions/packages?type=student' },
  ]},
  { title: 'Essentials', items: [
    { label: 'Mattress Multipacks', href: '/landlord-solutions/essentials?category=mattresses' },
    { label: 'Replacement Bundles', href: '/landlord-solutions/essentials?category=replacements' },
    { label: 'Damage Replacement', href: '/landlord-solutions/essentials?category=damage' },
    { label: 'Clearance Turnaround', href: '/landlord-solutions/essentials?category=clearance' },
  ]},
  { title: 'Business Tools', items: [
    { label: 'Download Landlord Catalogue (PDF)', href: '/landlord-solutions/catalogue', description: 'Complete product guide' },
    { label: 'Apply for Trade Account', href: '/landlord-solutions/trade', description: 'Get wholesale pricing' },
    { label: '30 Day Payment Info', href: '/landlord-solutions/payment-terms', description: 'Flexible payment options' },
    { label: 'Book Bulk Delivery', href: '/landlord-solutions/bulk-delivery', description: 'Schedule large orders' },
  ]},
];
