export interface Tree {
  uid: string;
  sample_name: string;
  species_code: string;
  site: string;
  project_code: string;
  data_types: string[];
  location: string;
}

export interface Project {
  code: string;
  description: string;
  lead_group: string;
  dtypes: string[];
}

export interface Species {
  code: string;
  name: string;
}

export interface ControlledVocab {
  species: Species[];
  sites: string[];
  data_types: string[];
  tissue_types: string[];
}

export interface RegistryData {
  trees: Tree[];
  projects: Project[];
  controlled_vocab: ControlledVocab;
}
