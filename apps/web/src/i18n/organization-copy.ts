import type { Locale } from './types';

export type OrganizationCopy = {
  heroLabel: string;
  legalName: string;
  stats: {
    totalEmployees: string;
    locations: string;
    departments: string;
    leaders: string;
  };
  sections: {
    locations: string;
    departments: string;
    structure: string;
  };
  labels: {
    headquarters: string;
    manager: string;
    employees: string;
    city: string;
    country: string;
  };
  footer: string;
};

const ORGANIZATION_COPY: Record<Locale, OrganizationCopy> = {
  en: {
    heroLabel: 'Organization Overview',
    legalName: 'Registered operating unit and reporting map',
    stats: {
      totalEmployees: 'Total Employees',
      locations: 'Locations',
      departments: 'Departments',
      leaders: 'Leaders',
    },
    sections: {
      locations: 'Location Network',
      departments: 'Department Map',
      structure: 'Reporting Structure',
    },
    labels: {
      headquarters: 'Headquarters',
      manager: 'Manager',
      employees: 'Employees',
      city: 'City',
      country: 'Country',
    },
    footer: 'This view will later connect to the Organization backend module.',
  },
  id: {
    heroLabel: 'Ringkasan Organisasi',
    legalName: 'Unit operasional terdaftar dan peta pelaporan',
    stats: {
      totalEmployees: 'Total Karyawan',
      locations: 'Lokasi',
      departments: 'Departemen',
      leaders: 'Pimpinan',
    },
    sections: {
      locations: 'Jaringan Lokasi',
      departments: 'Peta Departemen',
      structure: 'Struktur Pelaporan',
    },
    labels: {
      headquarters: 'Kantor Pusat',
      manager: 'Manajer',
      employees: 'Karyawan',
      city: 'Kota',
      country: 'Negara',
    },
    footer: 'Tampilan ini akan terhubung ke modul backend Organization pada tahap berikutnya.',
  },
};

export function getOrganizationCopy(locale: Locale): OrganizationCopy {
  return ORGANIZATION_COPY[locale];
}
