use super::models::EegDataset;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone, Default)]
pub struct AppState {
    dataset: Arc<RwLock<Option<EegDataset>>>,
}
impl AppState {
    pub async fn replace(&self, dataset: EegDataset) {
        *self.dataset.write().await = Some(dataset);
    }
    pub async fn dataset(&self) -> Option<EegDataset> {
        self.dataset.read().await.clone()
    }
}
