use dotenvy;
use axum::{
    routing::{get, post},
    http::StatusCode,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tracing::{info, span, instrument, trace, debug};   
use tracing_subscriber::{prelude::*, filter::EnvFilter, fmt};
use clap::Parser;
use std::path::PathBuf;

mod modules;


/// My app — configurable via CLI args, env vars, or .env file.
#[derive(Parser, Debug)]
#[command(name = "hub_server", version, about, long_about = None)]
struct Cli {

    /// Server bind address
    #[arg(long, env = "BIND_ADDR", default_value = "127.0.0.1:3000")]
    bind_addr: String,

    /// Log level (RUST_LOG compatible)
    #[arg(long, env = "RUST_LOG", default_value = "info")]
    rust_log: String,

    /// Alternative .env file path
    #[arg(long, default_value = ".env")]
    env_file: PathBuf,
}

#[tokio::main]
async fn main() {
     // 1. Parse CLI args first, so --env-file is available
    let cli = Cli::parse();
    // 2. Load the .env file (silently skip if missing)
    dotenvy::from_filename(&cli.env_file).ok();
    // 3. Re-parse so env-file values fill in missing args
    //    (clap reads env vars by default; dotenvy already set them)
    let cli = Cli::parse();

    // initialize tracing
    tracing_subscriber::registry()
    .with(EnvFilter::new(&cli.rust_log))
    .with(fmt::layer())
    .init();
    // tracing_subscriber::fmt::init( );
    // let main_span = tracing::info_span!("main");
    // let _enter = main_span.enter();
    info!("Starting server...");

    // build our application with a route
    let app = Router::new()
        // `GET  /` goes to `root`
        .route("/", get(modules::hello::root))
        // `POST /users` goes to `create_user`
        .route("/users", post(create_user));

    // run our app with hyper, listening globally on port 3000
    let svr_addr = format!("{}", cli.bind_addr);
    let listener = tokio::net::TcpListener::bind(&svr_addr).await.unwrap();
    info!("Deploying server on {}", svr_addr);
    axum::serve(listener, app).await.unwrap();
}




#[instrument]
async fn create_user(
    // this argument tells axum to parse the request body
    // as JSON into a `CreateUser` type
    Json(payload): Json<CreateUser>,
) -> (StatusCode, Json<User>) {
    debug!("creating user...");
    // insert your application logic here
    let user = User {
        id: 1337,
        username: payload.username,
    };

    // this will be converted into a JSON response
    // with a status code of `201 Created`
    debug!("user created: {:?}", user);
    (StatusCode::CREATED, Json(user))
}

// the input to our `create_user` handler
#[derive(Debug, Deserialize)]
struct CreateUser {
    username: String,
}

// the output to our `create_user` handler
#[derive(Debug, Serialize )]
struct User {
    id: u64,
    username: String,
}